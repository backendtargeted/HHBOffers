from app import db
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func # For default timestamps
from datetime import datetime

class Property(db.Model):
    __tablename__ = 'properties'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    first_name = db.Column(db.String(100), nullable=True)
    last_name = db.Column(db.String(100), nullable=True)
    property_address = db.Column(db.String(255), nullable=False)
    property_city = db.Column(db.String(100), nullable=False)
    property_state = db.Column(db.String(2), nullable=False) # Consider db.CHAR(2) if fixed length
    property_zip = db.Column(db.String(10), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    offer_histories = db.relationship('OfferHistory', back_populates='property', lazy='dynamic', cascade='all, delete-orphan')

    # Unique constraint for address combination (matches idx_property_unique)
    __table_args__ = (
        db.UniqueConstraint('property_address', 'property_city', 'property_state', 'property_zip', name='idx_property_unique'),
        db.Index('idx_properties_address_full', 'property_address', 'property_city', 'property_state', 'property_zip'), # Replicates the one in Property.ts
        db.Index('idx_properties_address', 'property_address'),
        db.Index('idx_properties_city', 'property_city'),
        db.Index('idx_properties_state', 'property_state'),
        db.Index('idx_properties_last_name', 'last_name'),
    )

    def __repr__(self):
        return f'<Property {self.id}: {self.property_address}>'

    # Virtual field for full name (example from Sequelize model)
    @property
    def full_name(self):
        return f"{self.first_name or ''} {self.last_name or ''}".strip() or 'Unknown'

    # Camel case representation for API responses
    def to_dict(self):
        return {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "propertyAddress": self.property_address,
            "propertyCity": self.property_city,
            "propertyState": self.property_state,
            "propertyZip": self.property_zip,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "fullName": self.full_name,
            # offerHistories will be handled separately if needed in the response
        }
