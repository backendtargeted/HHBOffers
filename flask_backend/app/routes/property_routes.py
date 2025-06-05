from flask import Blueprint, request, jsonify
from app.models import Property, OfferHistory # Assuming OfferHistory is needed for includes
from app import db, create_app # create_app for app.redis if needed directly
from sqlalchemy.orm import joinedload
from sqlalchemy import or_ # For search query
import json # For parsing cached data if stored as string
# Import redis from the app instance if configured, or initialize separately
# For now, we'll assume app.redis is available via current_app from Flask

# Get current app instance to access redis
from flask import current_app

bp = Blueprint('properties', __name__)

@bp.route('/', methods=['GET'])
def get_all_properties():
    try:
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('limit', 20, type=int) # 'limit' from original Node app

        # Cache key (similar to Node app)
        cache_key = f"properties:all:page={page}:limit={page_size}"

        if current_app.redis:
            cached_data = current_app.redis.get(cache_key)
            if cached_data:
                try:
                    # Assuming cached_data is a JSON string
                    parsed_cached_data = json.loads(cached_data.decode('utf-8'))
                    # Ensure it has the expected structure
                    if 'items' in parsed_cached_data and 'total' in parsed_cached_data:
                         return jsonify({
                            "success": True,
                            "fromCache": True,
                            "data": parsed_cached_data['items'],
                            "total": parsed_cached_data['total'],
                            "page": parsed_cached_data.get('page', page),
                            "pageSize": parsed_cached_data.get('pageSize', page_size),
                            "totalPages": parsed_cached_data.get('totalPages')
                        }), 200
                except json.JSONDecodeError:
                    current_app.logger.warn(f"Failed to parse cached data for key: {cache_key}")
                except Exception as e:
                    current_app.logger.error(f"Error processing cached data: {e}")


        # Query with pagination and eager load offer_histories
        # Original controller includes OfferHistory ordered by offer_date DESC
        paginated_query = (
            Property.query
            .options(joinedload(Property.offer_histories))
            .order_by(Property.id.asc()) # Add some default ordering
            .paginate(page=page, per_page=page_size, error_out=False)
        )

        properties = paginated_query.items
        total_properties = paginated_query.total
        total_pages = paginated_query.pages

        # Transform properties to dict using model's to_dict method
        # and include offer histories, also transformed.
        properties_data = []
        for prop in properties:
            prop_dict = prop.to_dict()
            # Sort offer_histories by offer_date DESC as in original
            sorted_offers = sorted(
                [oh.to_dict() for oh in prop.offer_histories],
                key=lambda x: x['offerDate'],
                reverse=True
            )
            prop_dict['offerHistories'] = sorted_offers
            properties_data.append(prop_dict)

        response_data = {
            "items": properties_data,
            "total": total_properties,
            "page": page,
            "pageSize": page_size,
            "totalPages": total_pages
        }

        if current_app.redis:
            try:
                # Store in cache for 5 minutes (300 seconds)
                current_app.redis.set(cache_key, json.dumps(response_data), ex=300)
            except Exception as e:
                current_app.logger.error(f"Failed to set cache for key {cache_key}: {e}")

        return jsonify({
            "success": True,
            "fromCache": False,
            "data": properties_data,
            "total": total_properties,
            "page": page,
            "pageSize": page_size,
            "totalPages": total_pages
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching properties: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Error fetching properties"}), 500

@bp.route('/<int:id>', methods=['GET'])
def get_property_by_id(id):
    try:
        cache_key = f"property:{id}"

        if current_app.redis:
            cached_property_json = current_app.redis.get(cache_key)
            if cached_property_json:
                try:
                    cached_property = json.loads(cached_property_json.decode('utf-8'))
                    return jsonify({
                        "success": True,
                        "fromCache": True,
                        "property": cached_property
                    }), 200
                except json.JSONDecodeError:
                    current_app.logger.warn(f"Failed to parse cached property for key: {cache_key}")
                except Exception as e:
                    current_app.logger.error(f"Error processing cached property: {e}")


        # Fetch property by ID, eagerly loading offer histories
        # Original controller includes OfferHistory ordered by offer_date DESC
        property_obj = (
            Property.query
            .options(joinedload(Property.offer_histories))
            .get(id)
        )

        if not property_obj:
            return jsonify({"success": False, "message": "Property not found"}), 404

        # Transform property and its offer histories
        property_data = property_obj.to_dict()
        sorted_offers = sorted(
            [oh.to_dict() for oh in property_obj.offer_histories],
            key=lambda x: x['offerDate'],
            reverse=True
        )
        property_data['offerHistories'] = sorted_offers

        if current_app.redis:
            try:
                # Store in cache for 10 minutes (600 seconds)
                current_app.redis.set(cache_key, json.dumps(property_data), ex=600)
            except Exception as e:
                current_app.logger.error(f"Failed to set cache for property {id}: {e}")

        # TODO: Implement ActivityLog for 'view' action (similar to original controller)
        # This will require ActivityLog model and its repository/service logic.
        # Example: ActivityLog.log_activity(action='view', entity_type='property', entity_id=str(id), ip_address=request.remote_addr)


        return jsonify({
            "success": True,
            "fromCache": False,
            "property": property_data
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching property with ID {id}: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Error fetching property"}), 500


@bp.route('/search', methods=['GET'])
def search_properties():
    try:
        query_str = request.args.get('q', '', type=str)
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)

        if not query_str or len(query_str) < 2: # As per original controller
            return jsonify({
                "success": True,
                "data": [],
                "total": 0,
                "page": page,
                "pageSize": limit,
                "totalPages": 0
            }), 200

        cache_key = f"properties:search:q={query_str}:page={page}:limit={limit}"

        if current_app.redis:
            cached_results_json = current_app.redis.get(cache_key)
            if cached_results_json:
                try:
                    cached_results = json.loads(cached_results_json.decode('utf-8'))
                    # Ensure it has the expected structure
                    if 'items' in cached_results and 'total' in cached_results:
                        return jsonify({
                            "success": True,
                            "fromCache": True,
                            "data": cached_results['items'],
                            "total": cached_results['total'],
                            "page": cached_results.get('page', page),
                            "pageSize": cached_results.get('pageSize', limit),
                            "totalPages": cached_results.get('totalPages')
                        }), 200
                except json.JSONDecodeError:
                    current_app.logger.warn(f"Failed to parse cached search results for key: {cache_key}")
                except Exception as e:
                    current_app.logger.error(f"Error processing cached search results: {e}")

        # Build search filter
        # Original searches on address, city, state, zip, owner name.
        # Assuming Property model has first_name, last_name, property_address, property_city, property_state, property_zip
        search_term = f"%{query_str}%"
        search_filter = or_(
            Property.first_name.ilike(search_term),
            Property.last_name.ilike(search_term),
            Property.property_address.ilike(search_term),
            Property.property_city.ilike(search_term),
            Property.property_state.ilike(search_term), # Exact match for state might be better if query is short
            Property.property_zip.ilike(search_term)
        )

        paginated_query = (
            Property.query
            .filter(search_filter)
            .options(joinedload(Property.offer_histories)) # Consistent with getAll
            .order_by(Property.id.asc()) # Default ordering
            .paginate(page=page, per_page=limit, error_out=False)
        )

        properties = paginated_query.items
        total_results = paginated_query.total
        total_pages = paginated_query.pages

        properties_data = []
        for prop in properties:
            prop_dict = prop.to_dict()
            sorted_offers = sorted(
                [oh.to_dict() for oh in prop.offer_histories],
                key=lambda x: x['offerDate'],
                reverse=True
            )
            prop_dict['offerHistories'] = sorted_offers
            properties_data.append(prop_dict)

        response_data_structure = {
            "items": properties_data,
            "total": total_results,
            "page": page,
            "pageSize": limit,
            "totalPages": total_pages
        }

        if current_app.redis:
            try:
                current_app.redis.set(cache_key, json.dumps(response_data_structure), ex=300) # Cache for 5 mins
            except Exception as e:
                current_app.logger.error(f"Failed to set cache for search query {query_str}: {e}")

        # TODO: Log search activity
        # Example: ActivityLog.log_activity(action='search', entity_type='property', details={'query': query_str, 'page': page, 'limit': limit, 'resultsCount': len(properties)}, ip_address=request.remote_addr)

        return jsonify({
            "success": True,
            "fromCache": False,
            "data": properties_data,
            "total": total_results,
            "page": page,
            "pageSize": limit,
            "totalPages": total_pages
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error searching properties with query {request.args.get('q')}: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Error searching properties"}), 500

@bp.route('/', methods=['POST'])
def create_property():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "message": "Invalid input. JSON data required."}), 400

        # Basic validation (more advanced validation can be added later)
        required_fields = ['propertyAddress', 'propertyCity', 'propertyState', 'propertyZip']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({"success": False, "message": f"Missing required fields: {', '.join(missing_fields)}"}), 400

        # Check for existing property with the same address (as per original logic)
        # Assumes model has these fields in snake_case
        existing_property = Property.query.filter_by(
            property_address=data['propertyAddress'],
            property_city=data['propertyCity'],
            property_state=data['propertyState'],
            property_zip=data['propertyZip']
        ).first()

        if existing_property:
            return jsonify({"success": False, "message": "Property with this address already exists"}), 409 # Conflict

        new_property = Property(
            first_name=data.get('firstName'), # Use .get for optional fields
            last_name=data.get('lastName'),
            property_address=data['propertyAddress'],
            property_city=data['propertyCity'],
            property_state=data['propertyState'],
            property_zip=data['propertyZip']
            # created_at and updated_at are handled by server_default/onupdate in the model
        )

        db.session.add(new_property)
        db.session.commit()

        # Invalidate related cache keys (e.g., all properties list)
        if current_app.redis:
            try:
                # Simple invalidation for keys starting with 'properties:all:'
                # More sophisticated invalidation might be needed depending on exact keys used
                keys_to_delete = current_app.redis.keys("properties:all:*")
                if keys_to_delete:
                    current_app.redis.delete(*keys_to_delete)
                current_app.logger.info(f"Invalidated {len(keys_to_delete)} 'properties:all:*' cache keys.")
            except Exception as e:
                current_app.logger.error(f"Error invalidating cache during property creation: {e}")

        # TODO: Log creation activity
        # Example: ActivityLog.log_activity(action='create', entity_type='property', entity_id=str(new_property.id), details=data, ip_address=request.remote_addr)

        property_data = new_property.to_dict()
        # New properties won't have offer histories by default
        property_data['offerHistories'] = []


        return jsonify({
            "success": True,
            "message": "Property created successfully",
            "property": property_data
        }), 201

    except Exception as e:
        db.session.rollback() # Rollback in case of error during DB operations
        current_app.logger.error(f"Error creating property: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Error creating property"}), 500


@bp.route('/<int:id>', methods=['PUT'])
def update_property(id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Invalid input. JSON data required."}), 400

        property_to_update = Property.query.get(id)
        if not property_to_update:
            return jsonify({"success": False, "message": "Property not found"}), 404

        # Check for address duplication if address fields are being changed
        if any(field in data for field in ['propertyAddress', 'propertyCity', 'propertyState', 'propertyZip']):
            new_address = data.get('propertyAddress', property_to_update.property_address)
            new_city = data.get('propertyCity', property_to_update.property_city)
            new_state = data.get('propertyState', property_to_update.property_state)
            new_zip = data.get('propertyZip', property_to_update.property_zip)

            existing_property_with_new_address = Property.query.filter(
                Property.id != id, # Exclude the current property
                Property.property_address == new_address,
                Property.property_city == new_city,
                Property.property_state == new_state,
                Property.property_zip == new_zip
            ).first()

            if existing_property_with_new_address:
                return jsonify({"success": False, "message": "Another property with this address already exists"}), 409

        # Update fields if provided in the payload
        if 'firstName' in data: property_to_update.first_name = data['firstName']
        if 'lastName' in data: property_to_update.last_name = data['lastName']
        if 'propertyAddress' in data: property_to_update.property_address = data['propertyAddress']
        if 'propertyCity' in data: property_to_update.property_city = data['propertyCity']
        if 'propertyState' in data: property_to_update.property_state = data['propertyState']
        if 'propertyZip' in data: property_to_update.property_zip = data['propertyZip']
        # updated_at is handled by onupdate in the model

        db.session.commit()

        # Invalidate caches
        if current_app.redis:
            try:
                keys_to_delete = current_app.redis.keys(f"property:{id}") + \
                                 current_app.redis.keys("properties:all:*") + \
                                 current_app.redis.keys("properties:search:*") # Broad invalidation
                if keys_to_delete: # redis.keys returns a list, ensure it's not empty
                   deleted_count = current_app.redis.delete(*keys_to_delete)
                   current_app.logger.info(f"Invalidated {deleted_count} cache keys for property update {id}.")
            except Exception as e:
                current_app.logger.error(f"Error invalidating cache for property update {id}: {e}")

        # TODO: Log update activity
        # Example: ActivityLog.log_activity(action='update', entity_type='property', entity_id=str(id), details=data, ip_address=request.remote_addr)

        property_data = property_to_update.to_dict()
        # Offer histories are part of to_dict if eager loaded, but update doesn't usually return them unless refetched.
        # For consistency with get_property_by_id, let's ensure offer_histories are included.
        # We can refetch or ensure they are loaded. Since we committed, they are up-to-date if not changed.
        # The .to_dict() method on property_to_update should already handle its current offer_histories.
        # If offer_histories were modified, that would be a separate endpoint.

        # Re-fetch to get offer_histories correctly if not already loaded or to be sure
        updated_prop_with_offers = Property.query.options(joinedload(Property.offer_histories)).get(id)
        property_data = updated_prop_with_offers.to_dict()
        sorted_offers = sorted(
            [oh.to_dict() for oh in updated_prop_with_offers.offer_histories],
            key=lambda x: x['offerDate'],
            reverse=True
        )
        property_data['offerHistories'] = sorted_offers


        return jsonify({
            "success": True,
            "message": "Property updated successfully",
            "property": property_data
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating property with ID {id}: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Error updating property"}), 500

@bp.route('/<int:id>', methods=['DELETE'])
def delete_property(id):
    try:
        property_to_delete = Property.query.get(id)
        if not property_to_delete:
            return jsonify({"success": False, "message": "Property not found"}), 404

        # Store details for logging before deletion if needed
        # deleted_property_details = property_to_delete.to_dict()

        db.session.delete(property_to_delete)
        db.session.commit()

        # Invalidate caches
        if current_app.redis:
            try:
                keys_to_delete = current_app.redis.keys(f"property:{id}") + \
                                 current_app.redis.keys("properties:all:*") + \
                                 current_app.redis.keys("properties:search:*")
                if keys_to_delete:
                    deleted_count = current_app.redis.delete(*keys_to_delete)
                    current_app.logger.info(f"Invalidated {deleted_count} cache keys for property deletion {id}.")
            except Exception as e:
                current_app.logger.error(f"Error invalidating cache for property deletion {id}: {e}")

        # TODO: Log deletion activity
        # Example: ActivityLog.log_activity(action='delete', entity_type='property', entity_id=str(id), details=deleted_property_details, ip_address=request.remote_addr)

        return jsonify({"success": True, "message": "Property deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting property with ID {id}: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Error deleting property"}), 500

@bp.route('/batch/create', methods=['POST'])
def batch_create_properties():
    try:
        data = request.get_json()
        if not isinstance(data, dict) or not isinstance(data.get('properties'), list):
            return jsonify({"success": False, "message": "Invalid input. Expected JSON object with a 'properties' list."}), 400

        properties_to_create_data = data['properties']
        results = {"total": len(properties_to_create_data), "created": 0, "failed": 0, "errors": []}
        created_properties_list = []

        for index, prop_data in enumerate(properties_to_create_data):
            required_fields = ['propertyAddress', 'propertyCity', 'propertyState', 'propertyZip']
            missing_fields = [field for field in required_fields if not prop_data.get(field)]
            if missing_fields:
                results['failed'] += 1
                results['errors'].append({"index": index, "error": f"Missing required fields: {', '.join(missing_fields)}"})
                continue

            existing_property = Property.query.filter_by(
                property_address=prop_data['propertyAddress'],
                property_city=prop_data['propertyCity'],
                property_state=prop_data['propertyState'],
                property_zip=prop_data['propertyZip']
            ).first()

            if existing_property:
                results['failed'] += 1
                results['errors'].append({"index": index, "id": prop_data.get('id'), "error": "Property with this address already exists"})
                continue

            try:
                new_property = Property(
                    first_name=prop_data.get('firstName'),
                    last_name=prop_data.get('lastName'),
                    property_address=prop_data['propertyAddress'],
                    property_city=prop_data['propertyCity'],
                    property_state=prop_data['propertyState'],
                    property_zip=prop_data['propertyZip']
                )
                db.session.add(new_property)
                # We need to commit per property to get its ID for logging, or collect all and commit once.
                # Original controller logs activity for each. Committing in loop can be slow.
                # For now, let's collect and commit once. IDs won't be available for individual logging if done this way before commit.
                # Alternative: add to session, flush to get ID, then log, then final commit.
                created_properties_list.append(new_property)
                results['created'] += 1
            except Exception as e_indiv:
                results['failed'] += 1
                results['errors'].append({"index": index, "error": str(e_indiv)})


        if created_properties_list:
            db.session.commit() # Commit all successful creations
            # Now that they are committed, they have IDs
            # TODO: Log batch_create activity for each created_property (will need their IDs)
            # for prop in created_properties_list: ActivityLog.log_activity(...)
        else:
            db.session.rollback() # Rollback if nothing was added, or if only errors occurred.

        if current_app.redis and results['created'] > 0:
            try:
                keys_to_delete = current_app.redis.keys("properties:all:*")
                if keys_to_delete: current_app.redis.delete(*keys_to_delete)
                current_app.logger.info(f"Invalidated 'properties:all:*' cache keys due to batch create.")
            except Exception as e:
                current_app.logger.error(f"Error invalidating cache during batch property creation: {e}")

        # Transform created_properties_list to dicts
        created_properties_data = [prop.to_dict() for prop in created_properties_list]
        for prop_d in created_properties_data: # Ensure offerHistories key
            prop_d['offerHistories'] = []


        return jsonify({
            "success": True,
            "results": results,
            "properties": created_properties_data # Return created properties
        }), 201 if results['created'] > 0 else 200 # 201 if at least one created

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error in batch creating properties: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Error in batch creating properties"}), 500

@bp.route('/batch', methods=['POST']) # Assuming this is for batch updates
def batch_update_properties():
    try:
        data = request.get_json()
        if not isinstance(data, dict) or not isinstance(data.get('properties'), list):
            return jsonify({"success": False, "message": "Invalid input. Expected JSON object with a 'properties' list."}), 400

        properties_to_update_data = data['properties']
        results = {"total": len(properties_to_update_data), "updated": 0, "failed": 0, "errors": []}
        updated_ids_for_cache_invalidation = set()

        for index, prop_data in enumerate(properties_to_update_data):
            prop_id = prop_data.get('id')
            if not prop_id:
                results['failed'] += 1
                results['errors'].append({"index": index, "error": "Missing property ID"})
                continue

            prop_id = int(prop_id) # Ensure it's an int
            property_to_update = Property.query.get(prop_id)

            if not property_to_update:
                results['failed'] += 1
                results['errors'].append({"index": index, "id": prop_id, "error": "Property not found"})
                continue

            try:
                # Check for address duplication if address fields are being changed
                if any(field in prop_data for field in ['propertyAddress', 'propertyCity', 'propertyState', 'propertyZip']):
                    new_address = prop_data.get('propertyAddress', property_to_update.property_address)
                    new_city = prop_data.get('propertyCity', property_to_update.property_city)
                    new_state = prop_data.get('propertyState', property_to_update.property_state)
                    new_zip = prop_data.get('propertyZip', property_to_update.property_zip)

                    existing_property_with_new_address = Property.query.filter(
                        Property.id != prop_id,
                        Property.property_address == new_address,
                        Property.property_city == new_city,
                        Property.property_state == new_state,
                        Property.property_zip == new_zip
                    ).first()

                    if existing_property_with_new_address:
                        results['failed'] += 1
                        results['errors'].append({"index": index, "id": prop_id, "error": "Another property with this address already exists"})
                        continue

                if 'firstName' in prop_data: property_to_update.first_name = prop_data['firstName']
                if 'lastName' in prop_data: property_to_update.last_name = prop_data['lastName']
                if 'propertyAddress' in prop_data: property_to_update.property_address = prop_data['propertyAddress']
                if 'propertyCity' in prop_data: property_to_update.property_city = prop_data['propertyCity']
                if 'propertyState' in prop_data: property_to_update.property_state = prop_data['propertyState']
                if 'propertyZip' in prop_data: property_to_update.property_zip = prop_data['propertyZip']

                # db.session.add(property_to_update) # Not strictly needed if object is already in session and modified
                results['updated'] += 1
                updated_ids_for_cache_invalidation.add(prop_id)
                # TODO: Log individual batch_update activity if needed (after commit)
            except Exception as e_indiv:
                results['failed'] += 1
                results['errors'].append({"index": index, "id": prop_id, "error": str(e_indiv)})

        if results['updated'] > 0:
            db.session.commit()
        else:
            db.session.rollback() # Rollback if nothing was updated

        # Invalidate caches
        if current_app.redis and updated_ids_for_cache_invalidation:
            try:
                keys_to_delete = current_app.redis.keys("properties:all:*") + \
                                 current_app.redis.keys("properties:search:*")
                for prop_id_inv in updated_ids_for_cache_invalidation:
                    keys_to_delete += current_app.redis.keys(f"property:{prop_id_inv}")

                if keys_to_delete: # Make sure list is not empty
                    # Remove duplicates by converting to set and back to list
                    unique_keys_to_delete = list(set(keys_to_delete))
                    deleted_count = current_app.redis.delete(*unique_keys_to_delete)
                    current_app.logger.info(f"Invalidated {deleted_count} cache keys due to batch update.")
            except Exception as e:
                current_app.logger.error(f"Error invalidating cache during batch property update: {e}")

        return jsonify({"success": True, "results": results}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error in batch updating properties: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Error in batch updating properties"}), 500
