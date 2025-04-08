import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Autocomplete, 
  CircularProgress, 
  Paper, 
  Typography, 
  Box,
  Chip,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { debounce } from 'lodash';

// Define TypeScript interface for property
interface Property {
  id: number;
  firstName?: string;
  lastName?: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  offer: number;
}

// Props interface
interface PropertySearchProps {
  onSearch: (query: string) => Promise<any[]>;
  onSelectProperty: (property: Property | null) => void;
  placeholder?: string;
  minSearchLength?: number;
}

const PropertySearch: React.FC<PropertySearchProps> = ({
  onSearch,
  onSelectProperty,
  placeholder = "Search by address, city, state, zip, or owner name",
  minSearchLength = 2
}) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Property[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Normalize property data (handle snake_case to camelCase conversion)
  const normalizeProperty = (prop: any): Property => {
    // Check if the property has snake_case fields
    if (prop.property_address || prop.first_name) {
      return {
        id: prop.id,
        firstName: prop.first_name || null,
        lastName: prop.last_name || null,
        propertyAddress: prop.property_address || '',
        propertyCity: prop.property_city || '',
        propertyState: prop.property_state || '',
        propertyZip: prop.property_zip || '',
        offer: prop.offer || 0
      };
    }
    return prop as Property;
  };

  // Perform search with debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.length < minSearchLength) {
      setOptions([]);
      return;
    }

    let active = true;
    setLoading(true);

    const searchProperties = async () => {
      try {
        const results = await onSearch(searchQuery);
        console.log('Search results:', results);
        
        if (active) {
          // Make sure we handle empty results gracefully
          if (!Array.isArray(results)) {
            console.log('Search results are not an array:', results);
            setOptions([]);
            return;
          }
          
          // Normalize the data - handle both camelCase and snake_case
          const normalizedResults = results.map(normalizeProperty);
          console.log('Normalized search results:', normalizedResults);
          setOptions(normalizedResults);
        }
      } catch (error) {
        console.error('Error searching properties:', error);
        if (active) {
          setOptions([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    searchProperties();

    return () => {
      active = false;
    };
  }, [searchQuery, onSearch, minSearchLength]);

  // Debounced search query updater
  const debouncedSetSearchQuery = debounce((value: string) => {
    setSearchQuery(value);
  }, 300);

  // Input value change handler
  const handleInputChange = (_event: React.SyntheticEvent, newInputValue: string) => {
    setInputValue(newInputValue);
    debouncedSetSearchQuery(newInputValue);
  };

  // Make sure we handle the Autocomplete option correctly
  const getOptionLabel = (option: Property | string) => {
    // Handle both string inputs and Property objects
    if (typeof option === 'string') {
      return option;
    }
    return `${option.propertyAddress}, ${option.propertyCity}, ${option.propertyState} ${option.propertyZip}`;
  };

  return (
    <Autocomplete
      id="property-search-autocomplete"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={loading}
      filterOptions={(x) => x} // Disable client-side filtering
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      onChange={(_event: React.SyntheticEvent, newValue: Property | null) => {
        console.log('Selected property:', newValue);
        onSelectProperty(newValue);
      }}
      onInputChange={handleInputChange}
      inputValue={inputValue}
      noOptionsText={inputValue.length < minSearchLength ? "Type to search..." : "No properties found"}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Box
            sx={{
              p: isMobile ? 2 : 1, // Adjust padding for mobile
              width: '100%'
            }}
          >
            <Typography
              variant={isMobile ? "body1" : "body2"} // Adjust variant for mobile
              fontWeight="medium"
              sx={{ wordBreak: 'break-word' }}
            >
              {option.propertyAddress}
            </Typography>

            <Typography
              variant={isMobile ? "body2" : "caption"} // Adjust variant for mobile
              color="text.secondary"
              sx={{ wordBreak: 'break-word' }}
            >
              {option.propertyCity}, {option.propertyState} {option.propertyZip}
            </Typography>

            <Box
              sx={{
                mt: 1,
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row', // Stack vertically on mobile
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {(option.firstName || option.lastName) ?
                  `${option.firstName || ''} ${option.lastName || ''}`.trim() :
                  'N/A'}
              </Typography>

              <Chip
                label={`$${option.offer ? option.offer.toLocaleString() : 0}`}
                size={isMobile ? "medium" : "small"} // Larger chip on mobile
                color="primary"
                sx={{ mt: isMobile ? 1 : 0 }} // Add margin top on mobile
              />
            </Box>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search Properties"
          placeholder={placeholder}
          fullWidth
          sx={{ // Style the root TextField
            '& .MuiInputBase-root': {
              fontSize: isMobile ? '1.1rem' : undefined // Larger font size on mobile
            }
          }}
          InputProps={{
            ...params.InputProps,
            sx: { // Style the input element itself
              py: isMobile ? 0.5 : undefined // Adjust vertical padding on mobile
            },
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
    />
  );
};

export default PropertySearch;
