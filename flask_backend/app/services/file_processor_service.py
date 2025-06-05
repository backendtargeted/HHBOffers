import pandas as pd
from app.models import UploadJob, Property, OfferHistory # Assuming OfferHistory might also be part of uploads
from app import db, current_app # For logging and session management
import os
from datetime import datetime

class FileProcessorService:
    def __init__(self, job_id, file_path):
        self.job_id = job_id
        self.file_path = file_path
        self.job = UploadJob.query.get(self.job_id)
        if not self.job:
            raise ValueError(f"UploadJob with ID {self.job_id} not found.")

        self.stats = {
            "total_records": 0,
            "processed_records": 0,
            "new_records": 0,
            "updated_records": 0,
            "error_records": 0,
            "error_details_list": [] # Store individual errors
        }

    def process_file(self):
        if not self.job:
            current_app.logger.error(f"Job {self.job_id} not found at start of processing.")
            return

        try:
            self.job.status = 'processing'
            self.job.started_at = datetime.utcnow()
            db.session.commit()

            file_extension = self.job.file_type.lower()
            if file_extension == 'csv':
                df = pd.read_csv(self.file_path)
            elif file_extension == 'xlsx':
                df = pd.read_excel(self.file_path)
            else:
                self.job.status = 'failed'
                self.job.error_details = "Unsupported file type"
                db.session.commit()
                return

            self.stats["total_records"] = len(df)
            self.job.total_records = self.stats["total_records"]
            db.session.commit()

            # Assuming file contains property data for now.
            # Column names in the file should match expected input (e.g., 'FirstName', 'PropertyAddress')
            # These should be mapped to model fields.
            # Example mapping (adjust based on actual expected file format):
            column_mapping = {
                'FirstName': 'first_name',
                'LastName': 'last_name',
                'PropertyAddress': 'property_address',
                'PropertyCity': 'property_city',
                'PropertyState': 'property_state',
                'PropertyZip': 'property_zip',
                # Add mappings for OfferHistory fields if they are part of the same file
                # e.g., 'OfferAmount': 'offer_amount', 'OfferDate': 'offer_date'
            }

            for index, row in df.iterrows():
                self.stats["processed_records"] += 1
                try:
                    # Basic data cleaning and transformation
                    property_data = {}
                    missing_required_fields = False

                    # Check for required Property fields based on your model/logic
                    # For Property: address, city, state, zip are usually required.
                    required_property_keys_in_row = ['PropertyAddress', 'PropertyCity', 'PropertyState', 'PropertyZip']
                    for req_key in required_property_keys_in_row:
                        if req_key not in row or pd.isna(row[req_key]):
                            self.stats["error_records"] += 1
                            self.stats["error_details_list"].append(f"Row {index+2}: Missing required field {req_key}")
                            missing_required_fields = True
                            break
                    if missing_required_fields:
                        continue # Skip to next row

                    # Populate property_data using column_mapping
                    for col_name, model_attr in column_mapping.items():
                        if col_name in row and not pd.isna(row[col_name]):
                            # Specific handling for dates if any for Property model itself
                            property_data[model_attr] = row[col_name]

                    # Logic to find existing property (e.g., by address)
                    # This matches the logic in property_routes.create_property and update_property
                    existing_property = Property.query.filter_by(
                        property_address=property_data['property_address'],
                        property_city=property_data['property_city'],
                        property_state=property_data['property_state'],
                        property_zip=property_data['property_zip']
                    ).first()

                    if existing_property:
                        # Update existing property
                        for attr, value in property_data.items():
                            setattr(existing_property, attr, value)
                        self.stats["updated_records"] += 1
                        # current_app.logger.info(f"Job {self.job_id}: Updated property {existing_property.id}")
                    else:
                        # Create new property
                        # Ensure all non-nullable fields for Property are present or have defaults
                        new_prop = Property(**property_data)
                        db.session.add(new_prop)
                        self.stats["new_records"] += 1
                        # current_app.logger.info(f"Job {self.job_id}: Creating new property with address {property_data['property_address']}")

                    # Commit per row or in batches to update job progress frequently
                    if index % 50 == 0: # Example: Commit every 50 records
                        db.session.commit()
                        self.update_job_progress()


                except Exception as e_row:
                    self.stats["error_records"] += 1
                    self.stats["error_details_list"].append(f"Row {index+2}: Error - {str(e_row)}")
                    db.session.rollback() # Rollback this row's transaction attempt

            db.session.commit() # Final commit for any remaining records
            self.job.status = 'completed'
            self.job.error_details = "\n".join(self.stats["error_details_list"]) if self.stats["error_details_list"] else None
            current_app.logger.info(f"File processing completed for job {self.job_id}. Summary: {self.stats}")

        except Exception as e_main:
            db.session.rollback()
            self.job.status = 'failed'
            self.job.error_details = f"Main processing error: {str(e_main)}\n" + "\n".join(self.stats["error_details_list"])
            current_app.logger.error(f"Error processing file for job {self.job_id}: {e_main}", exc_info=True)
        finally:
            self.job.completed_at = datetime.utcnow()
            self.update_job_progress() # Save final stats
            db.session.commit()
            # Optionally remove the processed file
            # try:
            #     if os.path.exists(self.file_path):
            #         os.remove(self.file_path)
            # except Exception as e_file_remove:
            #     current_app.logger.error(f"Error removing processed file {self.file_path}: {e_file_remove}")


    def update_job_progress(self):
        if self.job:
            self.job.processed_records = self.stats["processed_records"]
            self.job.new_records = self.stats["new_records"]
            self.job.updated_records = self.stats["updated_records"]
            self.job.error_records = self.stats["error_records"]
            # Avoid overwriting detailed error from main exception block if already set
            if self.job.status != 'failed' or not self.job.error_details:
                 self.job.error_details = "\n".join(self.stats["error_details_list"]) if self.stats["error_details_list"] else None
            db.session.commit()
