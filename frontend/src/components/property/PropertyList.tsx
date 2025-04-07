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
  Button,
  useMediaQuery,
  useTheme,
  Container,
  TextField,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { Property } from './PropertyDetail';
import PropertyMobileCard from './PropertyMobileCard';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch properties when page, limit, or search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProperties(page, limit);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [page, limit, searchQuery]);

  // Function to fetch properties
  const fetchProperties = async (page: number, limit: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAllProperties(page, limit);
      
      // Handle different response formats
      if (response.success && Array.isArray(response.rows)) {
        setProperties(response.rows);
        setTotalPages(response.totalPages || 1);
        setTotalItems(response.count || response.rows.length);
      } else if (response.success && Array.isArray(response.properties)) {
        setProperties(response.properties);
        setTotalPages(response.totalPages || 1);
        setTotalItems(response.count || response.properties.length);
      } else if (Array.isArray(response)) {
        setProperties(response);
        setTotalPages(1);
        setTotalItems(response.length);
      } else {
        setProperties([]);
        setError('Unexpected response format');
      }
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

  // Handle property selection
  const handlePropertySelect = (property: Property) => {
    if (onSelectProperty) {
      onSelectProperty(property);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount === 0) {
      return 'Please Call';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Container maxWidth={isMobile ? "sm" : "lg"}>
      <Box sx={{ width: '100%', mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by address, city, or zip..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

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
            {isMobile ? (
              // Mobile card view
              <Box>
                {properties.map((property) => (
                  <PropertyMobileCard
                    key={property.id}
                    property={property}
                    onSelect={handlePropertySelect}
                  />
                ))}
              </Box>
            ) : (
              // Desktop table view
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
                          {property.firstName || ''} {property.lastName || ''}
                          {!property.firstName && !property.lastName && 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          {property.offer === 0.00 ? "Please Call" : formatCurrency(property.offer)}
                        </TableCell>
                        <TableCell align="center">
                          <Button 
                            variant="contained" 
                            size="small" 
                            onClick={() => handlePropertySelect(property)}
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
            )}

            <Box display="flex" justifyContent="center" my={3}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary"
                size={isMobile ? "small" : "medium"}
                showFirstButton
                showLastButton
              />
            </Box>
            
            <Typography 
              variant="body2" 
              color="text.secondary" 
              align="center"
              sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
            >
              Showing {properties.length} of {totalItems} properties
            </Typography>
          </>
        )}
      </Box>
    </Container>
  );
};

export default PropertyTableList;