import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography
} from '@mui/material';

interface HeaderMappingDialogProps {
  open: boolean;
  onClose: () => void;
  headers: string[];
  onConfirm: (mapping: Record<string, string>) => void;
}

const requiredFields = [
  { field: 'propertyAddress', label: 'Property Address', required: true },
  { field: 'propertyCity', label: 'City', required: true },
  { field: 'propertyState', label: 'State', required: true },
  { field: 'propertyZip', label: 'ZIP Code', required: true },
  { field: 'offer', label: 'Offer Amount', required: true },
  { field: 'firstName', label: 'First Name', required: false },
  { field: 'lastName', label: 'Last Name', required: false }
];

const HeaderMappingDialog: React.FC<HeaderMappingDialogProps> = ({
  open,
  onClose,
  headers,
  onConfirm
}) => {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [autoMatched, setAutoMatched] = useState<string[]>([]);

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
  const handleConfirm = () => {
    onConfirm(mapping);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Map File Headers</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" paragraph>
          Please map the headers from your file to the required fields in our system.
          We've tried to automatically match some fields for you.
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {requiredFields.map(({ field, label, required }) => (
            <Grid item xs={12} sm={6} key={field}>
              <FormControl fullWidth variant="outlined" required={required}>
                <InputLabel>{label} {required ? '(Required)' : '(Optional)'}</InputLabel>
                <Select
                  value={mapping[field] || ''}
                  onChange={(e) => handleMappingChange(field, e.target.value as string)}
                  label={`${label} ${required ? '(Required)' : '(Optional)'}`}
                >
                  <MenuItem value="">
                    <em>Not mapped</em>
                  </MenuItem>
                  {headers.map(header => (
                    <MenuItem 
                      key={header} 
                      value={header}
                      sx={{
                        fontWeight: autoMatched.includes(header) ? 'bold' : 'normal',
                        color: autoMatched.includes(header) ? 'primary.main' : 'inherit'
                      }}
                    >
                      {header} {autoMatched.includes(header) && ' (Auto-matched)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          color="primary" 
          variant="contained"
          disabled={!isValid()}
        >
          Confirm Mapping
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HeaderMappingDialog;
