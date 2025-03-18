import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { Property } from './PropertyDetail';

interface PropertyTableListProps {
  getAllProperties: (page: number, limit: number) => Promise<any>;
  onSelectProperty?: (property: Property) => void;
  limit?: number;
}

const PropertyTableList: React.FC<PropertyTableListProps> = ({ 
  getAllProperties, 
  onSelectProperty, 
  limit = 20 
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch properties when page or limit changes
  useEffect(() => {
    fetchProperties(page, limit);
  }, [page, limit]);

  // Function to fetch properties
  const fetchProperties = async (page: number, limit: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAllProperties(page, limit);
      console.log('API Response:', response);
      
      // Handle different response formats
      let propertyList: Property[] = [];
      
      if (response && response.rows) {
        // Convert snake_case to camelCase
        propertyList = response.rows.map((item: any) => ({
          id: item.id,
          firstName: item.first_name || item.firstName,
          lastName: item.last_name || item.lastName,
          propertyAddress: item.property_address || item.propertyAddress,
          propertyCity: item.property_city || item.propertyCity,
          propertyState: item.property_state || item.propertyState,
          propertyZip: item.property_zip || item.propertyZip,
          offer: item.offer,
          createdAt: item.created_at || item.createdAt,
          updatedAt: item.updated_at || item.updatedAt
        }));
        
        setProperties(propertyList);
        setTotalPages(response.totalPages || 1);
        setTotalItems(response.count || propertyList.length);
      } else if (response && response.properties) {
        propertyList = response.properties;
        setProperties(propertyList);
        setTotalPages(response.totalPages || 1);
        setTotalItems(response.count || propertyList.length);
      } else if (Array.isArray(response)) {
        propertyList = response;
        setProperties(propertyList);
        setTotalPages(1);
        setTotalItems(propertyList.length);
      } else {
        setProperties([]);
        setError('Unexpected response format');
      }
      
      console.log('Processed property list:', propertyList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch properties');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination change
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Handle property row click
  const handleRowClick = (property: Property) => {
    if (onSelectProperty) {
      onSelectProperty(property);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" gutterBottom>
        All Properties
      </Typography>
      
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}
      
      {!loading && properties.length === 0 && !error && (
        <Alert severity="info" sx={{ my: 2 }}>
          No properties found.
        </Alert>
      )}
      
      {properties.length > 0 && (
        <>
          <TableContainer component={Paper} sx={{ mt: 2, mb: 2 }}>
            <Table aria-label="property table">
              <TableHead>
                <TableRow>
                  <TableCell>Address</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>ZIP</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell align="right">Offer</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {properties.map((property) => (
                  <TableRow 
                    key={property.id}
                    hover
                    sx={{ 
                      cursor: onSelectProperty ? 'pointer' : 'default',
                      '&:last-child td, &:last-child th': { border: 0 }
                    }}
                  >
                    <TableCell component="th" scope="row">
                      {property.propertyAddress || 'Unknown'}
                    </TableCell>
                    <TableCell>{property.propertyCity || ''}</TableCell>
                    <TableCell>{property.propertyState || ''}</TableCell>
                    <TableCell>{property.propertyZip || ''}</TableCell>
                    <TableCell>
                      {(property.firstName || property.lastName) ? 
                        `${property.firstName || ''} ${property.lastName || ''}`.trim() : 
                        'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(property.offer || 0)}
                    </TableCell>
                    <TableCell align="center">
                      <Button 
                        variant="contained" 
                        size="small" 
                        onClick={() => handleRowClick(property)}
                        color="primary"
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box display="flex" justifyContent="center" my={3}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange} 
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
          
          <Typography variant="body2" color="textSecondary" align="center">
            Showing {properties.length} of {totalItems} properties
          </Typography>
        </>
      )}
    </Box>
  );
};

export default PropertyTableList;