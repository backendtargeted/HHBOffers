from flask import Blueprint, request, jsonify, current_app
from app.models import Property, OfferHistory, UploadJob
from app import db
from sqlalchemy import func, Date, cast # For database functions like count, sum, avg, cast
from datetime import datetime # For parsing date strings

bp = Blueprint('stats', __name__)

@bp.route('/summary', methods=['GET'])
def get_summary_stats():
    # TODO: Implement caching for this endpoint
    cache_key = "stats:summary"
    # if current_app.redis: ... get from cache ...

    try:
        total_properties = Property.query.count()
        total_offers = OfferHistory.query.count()

        upload_jobs_summary = db.session.query(
            UploadJob.status,
            func.count(UploadJob.id)
        ).group_by(UploadJob.status).all()

        upload_stats = {status: count for status, count in upload_jobs_summary}

        summary = {
            "totalProperties": total_properties,
            "totalOffers": total_offers,
            "uploadJobs": {
                "total": sum(upload_stats.values()),
                "pending": upload_stats.get('pending', 0),
                "processing": upload_stats.get('processing', 0),
                "completed": upload_stats.get('completed', 0),
                "failed": upload_stats.get('failed', 0),
                "cancelled": upload_stats.get('cancelled', 0),
            }
        }

        # if current_app.redis: ... set to cache ...

        return jsonify({"success": True, "stats": summary}), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching summary stats: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Error fetching summary stats"}), 500

@bp.route('/properties/by-city', methods=['GET'])
def get_property_stats_by_city():
    # TODO: Implement caching
    try:
        city_stats_query = (
            db.session.query(
                Property.property_city,
                func.count(Property.id).label('property_count')
            )
            .group_by(Property.property_city)
            .order_by(func.count(Property.id).desc())
            .all()
        )

        city_stats = [{"city": city, "count": count} for city, count in city_stats_query]

        return jsonify({"success": True, "stats": city_stats}), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching property stats by city: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Error fetching property stats by city"}), 500

@bp.route('/properties/by-state', methods=['GET'])
def get_property_stats_by_state():
    # TODO: Implement caching
    try:
        state_stats_query = (
            db.session.query(
                Property.property_state,
                func.count(Property.id).label('property_count')
            )
            .group_by(Property.property_state)
            .order_by(func.count(Property.id).desc())
            .all()
        )

        state_stats = [{"state": state, "count": count} for state, count in state_stats_query]

        return jsonify({"success": True, "stats": state_stats}), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching property stats by state: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Error fetching property stats by state"}), 500

@bp.route('/offers/by-range', methods=['GET'])
def get_offer_stats_by_date_range():
    # TODO: Implement caching
    start_date_str = request.args.get('startDate') # Expected YYYY-MM-DD
    end_date_str = request.args.get('endDate')     # Expected YYYY-MM-DD

    if not start_date_str or not end_date_str:
        return jsonify({"success": False, "message": "Missing startDate or endDate query parameters"}), 400

    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"success": False, "message": "Invalid date format. Use YYYY-MM-DD."}), 400

    try:
        # Offer amounts are stored as TEXT, need to cast to a numeric type for sum/avg.
        # This assumes offer_amount can be safely cast to numeric. If not, more cleaning is needed.
        # Using float for average, ensure your DB supports this cast or use an appropriate numeric type.
        # PostgreSQL can cast text to numeric or double precision.
        offer_stats_query = (
            db.session.query(
                func.count(OfferHistory.id).label('total_offers'),
                func.sum(cast(OfferHistory.offer_amount, db.Numeric)).label('total_offer_value'),
                func.avg(cast(OfferHistory.offer_amount, db.Numeric)).label('average_offer_amount')
            )
            .filter(OfferHistory.offer_date >= start_date)
            .filter(OfferHistory.offer_date <= end_date)
            .one_or_none() # Expect one row of aggregated results
        )

        if offer_stats_query and offer_stats_query.total_offers is not None:
            stats = {
                "totalOffers": offer_stats_query.total_offers,
                # Convert Decimal to float for JSON serialization if using db.Numeric
                "totalOfferValue": float(offer_stats_query.total_offer_value) if offer_stats_query.total_offer_value is not None else 0,
                "averageOfferAmount": float(offer_stats_query.average_offer_amount) if offer_stats_query.average_offer_amount is not None else 0
            }
        else: # No offers in range
            stats = {
                "totalOffers": 0,
                "totalOfferValue": 0,
                "averageOfferAmount": 0
            }

        return jsonify({"success": True, "stats": stats, "range": {"startDate": start_date_str, "endDate": end_date_str}}), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching offer stats by date range: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Error fetching offer stats by date range"}), 500
