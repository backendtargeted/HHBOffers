from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
import uuid # For generating unique filenames or job IDs if model doesn't do it by default for ID.
from app.models import UploadJob
from app import db
from app.services import FileProcessorService

bp = Blueprint('uploads', __name__)

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads') # Or use app.config['UPLOAD_FOLDER']
ALLOWED_EXTENSIONS = {'csv', 'xlsx'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/', methods=['POST'])
def handle_file_upload():
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "No file part in the request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "message": "No selected file"}), 400

    if file and allowed_file(file.filename):
        original_filename = secure_filename(file.filename)
        # Generate a unique filename to prevent overwrites, or use job ID as filename
        # For now, just using original filename, assuming job ID will differentiate if stored by job ID.
        # A better approach might be to save it as <job_id>.<extension>

        # The UploadJob model ID is a UUID string, which can be generated here or by the model.
        # Model default: default=lambda: str(uuid.uuid4()) - so we don't need to set it here.

        file_ext = original_filename.rsplit('.', 1)[1].lower()

        # Create UploadJob record first to get an ID, then save file with that ID.
        # However, our model generates ID on commit. So, we might need a placeholder or save then update.
        # For now, let's assume the FileProcessorService will handle the actual file path logic.
        # We'll store the original filename and let the service figure out storage with the job ID.

        try:
            new_job = UploadJob(
                filename=original_filename,
                file_type=file_ext, # csv or xlsx
                status='pending'
                # total_records, processed_records etc. will be updated by the processor service
            )
            db.session.add(new_job)
            db.session.commit() # Commit to get the ID for the new_job object

            # Now that new_job.id is available, construct a path.
            # This path is where the service will expect it or where we save it.
            # For this example, let's save it.
            # A more robust solution would pass the stream to a service or background task.
            file_path = os.path.join(UPLOAD_FOLDER, f"{new_job.id}_{original_filename}")
            file.save(file_path)
            current_app.logger.info(f"File saved to: {file_path}")

            # Trigger synchronous file processing
            try:
                processor = FileProcessorService(job_id=new_job.id, file_path=file_path)
                processor.process_file() # This is a synchronous call
                # Job status will be updated by the service, reload to get latest state for response
                db.session.refresh(new_job)
            except Exception as e_proc:
                current_app.logger.error(f'Error during synchronous processing call for job {new_job.id}: {e_proc}', exc_info=True)
                # Job status might need to be marked as failed if processor didn't handle it
                if new_job.status not in ['completed', 'failed']:
                    new_job.status = 'failed'
                    new_job.error_details = str(e_proc)
                    db.session.commit()

            # TODO: Log activity: action='file_upload', entity_type='upload_job', entity_id=new_job.id

            return jsonify({
                "success": True,
                "message": "File uploaded successfully. Processing started.",
                "job": new_job.to_dict()
            }), 201

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error handling file upload for {original_filename}: {e}", exc_info=True)
            # Consider deleting the saved file if the DB transaction failed
            # if 'file_path' in locals() and os.path.exists(file_path): os.remove(file_path)
            return jsonify({"success": False, "message": "Error processing file upload"}), 500
    else:
        return jsonify({"success": False, "message": "File type not allowed"}), 400

@bp.route('/jobs', methods=['GET'])
def get_all_upload_jobs():
    try:
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('limit', 20, type=int)

        # TODO: Add caching if desired

        paginated_query = (
            UploadJob.query
            .order_by(UploadJob.created_at.desc())
            .paginate(page=page, per_page=page_size, error_out=False)
        )

        jobs = paginated_query.items
        total_jobs = paginated_query.total
        total_pages = paginated_query.pages

        jobs_data = [job.to_dict() for job in jobs]

        return jsonify({
            "success": True,
            "data": jobs_data,
            "total": total_jobs,
            "page": page,
            "pageSize": page_size,
            "totalPages": total_pages
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching upload jobs: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Error fetching upload jobs"}), 500

@bp.route('/jobs/<job_id>', methods=['GET']) # job_id is UUID string
def get_upload_job_status(job_id):
    try:
        # Validate if job_id is a valid UUID string before querying if necessary,
        # or rely on DB to handle it / SQLAlchemy's type conversion.
        # For string UUID PKs, direct query is fine.

        # TODO: Add caching if desired (e.g., for jobs that are 'completed' or 'failed')

        job = UploadJob.query.get(job_id) # .get() works with PKs

        if not job:
            return jsonify({"success": False, "message": "Upload job not found"}), 404

        return jsonify({"success": True, "job": job.to_dict()}), 200

    except Exception as e:
        # If job_id is not UUID format, .get() might raise an error with some DB drivers/SQLAlchemy versions
        # or just return None. Catching general Exception here.
        current_app.logger.error(f"Error fetching status for job ID {job_id}: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Error fetching job status"}), 500
