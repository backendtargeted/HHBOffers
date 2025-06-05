from app import db
from sqlalchemy.sql import func # For default timestamps
from datetime import datetime

class OfferHistory(db.Model):
    __tablename__ = 'offer_histories'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False)
    offer_amount = db.Column(db.Text, nullable=False) # Kept as Text to match original
    offer_date = db.Column(db.Date, nullable=False) # Kept as Date to match original DATEONLY
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    # Original table had updated_at with a trigger, adding it here for consistency
    updated_at = db.Column(db.DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


    # Relationships
    property = db.relationship('Property', back_populates='offer_histories')

    __table_args__ = (
        db.Index('idx_offer_history_property', 'property_id'),
        db.Index('idx_offer_history_date', 'offer_date'),
    )

    def __repr__(self):
        return f'<OfferHistory {self.id} for Property {self.property_id}>'

    # Camel case representation for API responses
    def to_dict(self):
        return {
            "id": self.id,
            "propertyId": self.property_id,
            "offerAmount": self.offer_amount,
            "offerDate": self.offer_date.isoformat() if self.offer_date else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
