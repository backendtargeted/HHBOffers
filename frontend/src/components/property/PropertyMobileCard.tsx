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
    <Card sx={{ mb: 2, p: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {property.propertyAddress}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {property.propertyCity}, {property.propertyState} {property.propertyZip}
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" color="primary">
            {new Intl.NumberFormat('en-US', { 
              style: 'currency', 
              currency: 'USD' 
            }).format(property.offer)}
          </Typography>
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
