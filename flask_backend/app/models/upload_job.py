from app import db
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func # For default timestamps
import uuid # For UUID default
from datetime import datetime

class UploadJob(db.Model):
    __tablename__ = 'upload_jobs'

    # Using String for ID to store UUID, with default from Python's uuid
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(10), nullable=False) # e.g., 'csv', 'xlsx'
    status = db.Column(db.String(20), nullable=False, default='pending') # 'pending', 'processing', 'completed', 'failed', 'cancelled'
    total_records = db.Column(db.Integer, default=0)
    processed_records = db.Column(db.Integer, default=0) # Added from init.sql
    new_records = db.Column(db.Integer, default=0)
    updated_records = db.Column(db.Integer, default=0)
    error_records = db.Column(db.Integer, default=0)
    error_details = db.Column(db.Text, nullable=True) # Added from init.sql
    started_at = db.Column(db.DateTime(timezone=True), nullable=True) # Added from init.sql
    completed_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


    __table_args__ = (
        db.Index('idx_upload_jobs_status', 'status'),
    )

    def __repr__(self):
        return f'<UploadJob {self.id} [{self.status}]>'

    # Camel case representation for API responses
    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "fileType": self.file_type,
            "status": self.status,
            "totalRecords": self.total_records,
            "processedRecords": self.processed_records,
            "newRecords": self.new_records,
            "updatedRecords": self.updated_records,
            "errorRecords": self.error_records,
            "errorDetails": self.error_details,
            "startedAt": self.started_at.isoformat() if self.started_at else None,
            "completedAt": self.completed_at.isoformat() if self.completed_at else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
