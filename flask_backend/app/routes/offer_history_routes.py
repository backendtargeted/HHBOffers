from flask import Blueprint, request, jsonify, current_app
from app.models import OfferHistory, Property
from app import db
import json # For cache invalidation if needed, though less direct caching here
from datetime import datetime # For parsing date strings

bp = Blueprint('offers', __name__)

@bp.route('/', methods=['POST'])
def create_offer_history():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Invalid input. JSON data required."}), 400

    property_id = data.get('propertyId')
    offer_amount = data.get('offerAmount')
    offer_date_str = data.get('offerDate') # Expect YYYY-MM-DD

    if not all([property_id, offer_amount, offer_date_str]):
        return jsonify({"success": False, "message": "Missing required fields: propertyId, offerAmount, offerDate"}), 400

    try:
        property_id = int(property_id)
        # Attempt to parse offer_date_str to datetime.date object
        offer_date_obj = datetime.strptime(offer_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"success": False, "message": "Invalid propertyId or offerDate format. Date should be YYYY-MM-DD."}), 400

    parent_property = Property.query.get(property_id)
    if not parent_property:
        return jsonify({"success": False, "message": "Property not found"}), 404

    try:
        new_offer = OfferHistory(
            property_id=property_id,
            offer_amount=str(offer_amount), # Ensure it's string as per model (Text type)
            offer_date=offer_date_obj
            # created_at, updated_at handled by model defaults
        )
        db.session.add(new_offer)
        db.session.commit()

        # Invalidate cache for the parent property
        if current_app.redis:
            cache_key_property = f"property:{property_id}"
            deleted_count = current_app.redis.delete(cache_key_property)
            if deleted_count > 0:
                current_app.logger.info(f"Invalidated cache for property {property_id} due to new offer.")
            # Also invalidate general property list caches as they might show offer counts or latest offers
            keys_to_delete_general = current_app.redis.keys("properties:all:*") + current_app.redis.keys("properties:search:*")
            if keys_to_delete_general:
                current_app.redis.delete(*list(set(keys_to_delete_general)))


        # TODO: Log activity: action='create_offer', entity_type='offer_history', entity_id=new_offer.id, parent_entity_id=property_id

        return jsonify({
            "success": True,
            "message": "Offer history created successfully",
            "offerHistory": new_offer.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating offer history for property {property_id}: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Error creating offer history"}), 500

@bp.route('/property/<int:property_id>', methods=['GET'])
def get_offer_history_for_property(property_id):
    parent_property = Property.query.get(property_id)
    if not parent_property:
        return jsonify({"success": False, "message": "Property not found"}), 404

    try:
        offers = (
            OfferHistory.query
            .filter_by(property_id=property_id)
            .order_by(OfferHistory.offer_date.desc())
            .all()
        )

        offers_data = [offer.to_dict() for offer in offers]

        return jsonify({"success": True, "offerHistories": offers_data}), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching offer history for property {property_id}: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Error fetching offer history"}), 500

@bp.route('/<int:offer_id>', methods=['PUT'])
def update_offer_history(offer_id):
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Invalid input. JSON data required."}), 400

    offer_to_update = OfferHistory.query.get(offer_id)
    if not offer_to_update:
        return jsonify({"success": False, "message": "Offer history not found"}), 404

    try:
        if 'offerAmount' in data:
            offer_to_update.offer_amount = str(data['offerAmount'])
        if 'offerDate' in data:
            try:
                offer_to_update.offer_date = datetime.strptime(data['offerDate'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"success": False, "message": "Invalid offerDate format. Date should be YYYY-MM-DD."}), 400

        # property_id is generally not updatable for an existing offer. If it is, more checks are needed.
        # For now, assume property_id does not change.

        db.session.commit()

        # Invalidate cache for the parent property
        if current_app.redis:
            cache_key_property = f"property:{offer_to_update.property_id}"
            deleted_count = current_app.redis.delete(cache_key_property)
            if deleted_count > 0:
                current_app.logger.info(f"Invalidated cache for property {offer_to_update.property_id} due to offer update.")
            keys_to_delete_general = current_app.redis.keys("properties:all:*") + current_app.redis.keys("properties:search:*")
            if keys_to_delete_general:
                current_app.redis.delete(*list(set(keys_to_delete_general)))


        # TODO: Log activity: action='update_offer', entity_type='offer_history', entity_id=offer_id

        return jsonify({
            "success": True,
            "message": "Offer history updated successfully",
            "offerHistory": offer_to_update.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating offer history {offer_id}: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Error updating offer history"}), 500

@bp.route('/<int:offer_id>', methods=['DELETE'])
def delete_offer_history(offer_id):
    offer_to_delete = OfferHistory.query.get(offer_id)
    if not offer_to_delete:
        return jsonify({"success": False, "message": "Offer history not found"}), 404

    parent_property_id = offer_to_delete.property_id # Get before deleting for cache invalidation

    try:
        db.session.delete(offer_to_delete)
        db.session.commit()

        # Invalidate cache for the parent property
        if current_app.redis:
            cache_key_property = f"property:{parent_property_id}"
            deleted_count = current_app.redis.delete(cache_key_property)
            if deleted_count > 0:
                current_app.logger.info(f"Invalidated cache for property {parent_property_id} due to offer deletion.")
            keys_to_delete_general = current_app.redis.keys("properties:all:*") + current_app.redis.keys("properties:search:*")
            if keys_to_delete_general:
                current_app.redis.delete(*list(set(keys_to_delete_general)))

        # TODO: Log activity: action='delete_offer', entity_type='offer_history', entity_id=offer_id

        return jsonify({"success": True, "message": "Offer history deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting offer history {offer_id}: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Error deleting offer history"}), 500
