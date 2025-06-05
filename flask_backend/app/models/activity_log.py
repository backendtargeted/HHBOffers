from app import db
from sqlalchemy.dialects.postgresql import JSONB # For details field
from sqlalchemy.sql import func # For default timestamps
from datetime import datetime

class ActivityLog(db.Model):
    __tablename__ = 'audit_logs' # Matches table name in 01-init.sql

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    action = db.Column(db.String(50), nullable=False) # Reduced length from 100 in Sequelize to 50 from init.sql
    entity_type = db.Column(db.String(50), nullable=False)
    entity_id = db.Column(db.String(50), nullable=True)
    details = db.Column(JSONB, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True) # Reduced length from 50 in Sequelize to 45 from init.sql
    user_agent = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    # No updated_at for audit logs usually

    __table_args__ = (
        db.Index('idx_activity_logs_entity', 'entity_type', 'entity_id'),
        db.Index('idx_activity_logs_action', 'action'),
        db.Index('idx_activity_logs_created_at', 'created_at'),
    )

    def __repr__(self):
        return f'<ActivityLog {self.id} - {self.action} on {self.entity_type}>'

    # Camel case representation for API responses
    def to_dict(self):
        return {
            "id": self.id,
            "action": self.action,
            "entityType": self.entity_type,
            "entityId": self.entity_id,
            "details": self.details,
            "ipAddress": self.ip_address,
            "userAgent": self.user_agent,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
