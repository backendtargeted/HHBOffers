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
  useTheme
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
  onSearch: (query: string) => Promise<Property[]>;
  onSelectProperty: (property: Property | null) => void;
  placeholder?: string;
  minSearchLength?: number;
}

const PropertySearch: React.FC<PropertySearchProps> = ({
  onSearch,
  onSelectProperty,
  placeholder = "Search by address, city, state, zip, or owner name",
  minSearchLength = 2
}: PropertySearchProps) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Property[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

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
        if (active) {
          setOptions(results);
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

  return (
    <Autocomplete
      id="property-search-autocomplete"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={loading}
      filterOptions={(x: any) => x} // Disable client-side filtering
      getOptionLabel={(option: Property) => `${option.propertyAddress}, ${option.propertyCity}, ${option.propertyState} ${option.propertyZip}`}
      onChange={(_event: React.SyntheticEvent, newValue: Property | null) => onSelectProperty(newValue)}
      onInputChange={handleInputChange}
      inputValue={inputValue}
      noOptionsText={inputValue.length < minSearchLength ? "Type to search..." : "No properties found"}
      renderOption={(props: React.DetailedHTMLProps<React.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>, option: Property) => (
        <li {...props}>
          <Paper
            elevation={0}
            sx={{
              p: 1,
              width: '100%',
              borderRadius: 1,
              '&:hover': {
                backgroundColor: theme.palette.action.hover
              }
            }}
          >
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Typography variant="body1" fontWeight="medium">
                  {option.propertyAddress}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  {option.propertyCity}, {option.propertyState} {option.propertyZip}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {option.firstName} {option.lastName}
                  </Typography>
                  <Chip
                    label={`$${option.offer.toLocaleString()}`}
                    size="small"
                    color="primary"
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </li>
      )}
      renderInput={(params: any) => (
        <TextField
          {...params}
          label="Search Properties"
          placeholder={placeholder}
          fullWidth
          InputProps={{
            ...params.InputProps,
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
}

export default PropertySearch;
