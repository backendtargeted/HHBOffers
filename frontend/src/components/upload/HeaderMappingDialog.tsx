import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  CircularProgress,
  FormControlLabel,
  Switch
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface HeaderMappingDialogProps {
  open: boolean;
  onClose: () => void;
  headers: string[];
  onConfirm: (mapping: Record<string, string>, offerDate?: Date) => void;
}

const requiredFields = [
  { field: 'propertyAddress', label: 'Property Address', required: true },
  { field: 'propertyCity', label: 'City', required: true },
  { field: 'propertyState', label: 'State', required: true },
  { field: 'propertyZip', label: 'ZIP Code', required: true },
  { field: 'offer', label: 'Offer Amount', required: true },
  { field: 'firstName', label: 'First Name', required: false },
  { field: 'lastName', label: 'Last Name', required: false },
  { field: 'offerDate', label: 'Offer Date', required: false }
];

const HeaderMappingDialog: React.FC<HeaderMappingDialogProps> = ({
  open,
  onClose,
  headers,
  onConfirm
}) => {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [autoMatched, setAutoMatched] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useDefaultDate, setUseDefaultDate] = useState(true);
  const [defaultDate, setDefaultDate] = useState<Date>(new Date());

  // Auto-detect headers on initialization
  useEffect(() => {
    if (headers.length > 0) {
      const newMapping: Record<string, string> = {};
      const matched: string[] = [];

      requiredFields.forEach(({ field }) => {
        // Try to match headers to our fields
        const match = findBestHeaderMatch(field, headers);
        if (match) {
          newMapping[field] = match;
          matched.push(match);
        }
      });

      setMapping(newMapping);
      setAutoMatched(matched);
    }
  }, [headers]);

  // Find best match for a field among headers
  const findBestHeaderMatch = (field: string, headers: string[]): string | null => {
    const fieldLower = field.toLowerCase();
    
    // Direct matches
    const directMatch = headers.find(h => h.toLowerCase() === fieldLower);
    if (directMatch) return directMatch;
    
    // Partial matches
    const partialMatches = headers.filter(h => {
      const headerLower = h.toLowerCase();
      
      if (fieldLower === 'propertyaddress' && 
         (headerLower.includes('address') || headerLower === 'addr')) {
        return true;
      }
      
      if (fieldLower === 'propertycity' && headerLower.includes('city')) {
        return true;
      }
      
      if (fieldLower === 'propertystate' && headerLower.includes('state')) {
        return true;
      }
      
      if (fieldLower === 'propertyzip' && 
         (headerLower.includes('zip') || headerLower.includes('postal'))) {
        return true;
      }
      
      if (fieldLower === 'firstname' && 
         (headerLower.includes('first') && headerLower.includes('name'))) {
        return true;
      }
      
      if (fieldLower === 'lastname' && 
         (headerLower.includes('last') && headerLower.includes('name'))) {
        return true;
      }
      
      if (fieldLower === 'offer' && 
         (headerLower.includes('offer') || headerLower.includes('price') || 
          headerLower === 'amount')) {
        return true;
      }

      if (fieldLower === 'offerdate' && 
         (headerLower.includes('date') || headerLower.includes('offer date'))) {
        return true;
      }
      
      return false;
    });
    
    return partialMatches.length > 0 ? partialMatches[0] : null;
  };

  // Update a field mapping
  const handleMappingChange = (field: string, header: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: header
    }));
  };

  // Check if all required fields are mapped
  const isValid = () => {
    return requiredFields
      .filter(f => f.required)
      .every(f => mapping[f.field]);
  };

  // Handle confirm button click
  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(mapping, useDefaultDate ? defaultDate : undefined);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Map File Headers</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" paragraph>
          Please map the headers from your file to the required fields in our system.
          We've tried to automatically match some fields for you.
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mt: 2 }}>
          {Object.entries(mapping).map(([key, value]) => (
            <Box key={key}>
              <Typography variant="subtitle2" gutterBottom>
                {key.replace(/_/g, ' ').toUpperCase()}
              </Typography>
              <TextField
                fullWidth
                select
                value={value}
                onChange={(e) => handleMappingChange(key, e.target.value)}
                SelectProps={{
                  native: true
                }}
                size="small"
              >
                <option value="">Select a column</option>
                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </TextField>
            </Box>
          ))}
        </Box>

        {/* Offer Date Section */}
        <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Offer Date Settings
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={useDefaultDate}
                onChange={(e) => setUseDefaultDate(e.target.checked)}
              />
            }
            label="Use default offer date for all records"
          />

          {useDefaultDate && (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Default Offer Date"
                value={defaultDate}
                onChange={(newDate) => newDate && setDefaultDate(newDate)}
                sx={{ mt: 2, width: '100%' }}
              />
            </LocalizationProvider>
          )}

          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            {useDefaultDate 
              ? "This date will be used for all records in the file."
              : "If a date column is mapped above, those values will be used. Otherwise, the current date will be used."}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={!isValid() || isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Confirm Mapping'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HeaderMappingDialog;
