// frontend/src/components/property/PropertyMobileCard.tsx

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box
} from '@mui/material';
import { Property } from './PropertyDetail';

interface PropertyMobileCardProps {
  property: Property;
  onSelect: (property: Property) => void;
}

const PropertyMobileCard: React.FC<PropertyMobileCardProps> = ({ property, onSelect }) => {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {property.propertyAddress}
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {property.propertyCity}, {property.propertyState} {property.propertyZip}
        </Typography>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained"
            onClick={() => onSelect(property)}
            size="large"
          >
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PropertyMobileCard;