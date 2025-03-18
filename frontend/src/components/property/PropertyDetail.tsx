import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Button,
  Chip,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Define validation schema
const propertyUpdateSchema = yup.object({
  id: yup.number().required('ID is required'),
  firstName: yup.string().optional(),
  lastName: yup.string().optional(),
  propertyAddress: yup.string().required('Address is required'),
  propertyCity: yup.string().required('City is required'),
  propertyState: yup
    .string()
    .required('State is required')
    .matches(/^[A-Z]{2}$/, 'State must be a 2-letter code'),
  propertyZip: yup
    .string()
    .required('ZIP code is required')
    .matches(/^\d{5}(-\d{4})?$/, 'ZIP code must be valid (e.g., 12345 or 12345-6789)'),
  offer: yup
    .number()
    .required('Offer is required')
    .min(0, 'Offer cannot be negative'),
  createdAt: yup.string().optional(),
  updatedAt: yup.string().optional()
}).required();

// Define TypeScript interfaces
export interface Property {
  id: number;
  firstName?: string;
  lastName?: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  offer: number;
  createdAt?: string;
  updatedAt?: string;
}

interface PropertyDetailProps {
  property: Property;
  onUpdate?: (id: number, data: Partial<Property>) => Promise<Property>;
  editable?: boolean;
  isLoading?: boolean;
}

const PropertyDetail: React.FC<PropertyDetailProps> = ({
  property,
  onUpdate,
  editable = false,
  isLoading = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Setup form
  const { control, handleSubmit, formState: { errors } } = useForm<Property>({
    resolver: yupResolver(propertyUpdateSchema),
    defaultValues: property
  });

  // Handle form submission
  const onSubmit = async (data: Property) => {
    if (!onUpdate) return;
    
    setUpdateError(null);
    try {
      await onUpdate(property.id, data);
      setIsEditing(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUpdateError(errorMessage);
    }
  };

  return (
    <Card elevation={3}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            Property Details
          </Typography>
          
          {editable && !isEditing && (
            <Button 
              startIcon={<EditIcon />} 
              variant="outlined" 
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
            >
              Edit
            </Button>
          )}
        </Box>
        
        {/* Edit Mode */}
        {isEditing ? (
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="First Name"
                      fullWidth
                      margin="normal"
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Last Name"
                      fullWidth
                      margin="normal"
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="propertyAddress"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Property Address"
                      fullWidth
                      required
                      margin="normal"
                      error={!!errors.propertyAddress}
                      helperText={errors.propertyAddress?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="propertyCity"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="City"
                      fullWidth
                      required
                      margin="normal"
                      error={!!errors.propertyCity}
                      helperText={errors.propertyCity?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Controller
                  name="propertyState"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="State"
                      fullWidth
                      required
                      margin="normal"
                      inputProps={{ maxLength: 2 }}
                      error={!!errors.propertyState}
                      helperText={errors.propertyState?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Controller
                  name="propertyZip"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="ZIP Code"
                      fullWidth
                      required
                      margin="normal"
                      error={!!errors.propertyZip}
                      helperText={errors.propertyZip?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="offer"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Offer Amount"
                      fullWidth
                      required
                      margin="normal"
                      type="number"
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                      }}
                      error={!!errors.offer}
                      helperText={errors.offer?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => setIsEditing(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={isLoading}
                  >
                    Save
                  </Button>
                </Box>
              </Grid>
            </Grid>
            
            {updateError && (
              <Box sx={{ mt: 2 }}>
                <Typography color="error">{updateError}</Typography>
              </Box>
            )}
          </Box>
        ) : (
          // View Mode
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6">
                {property.propertyAddress}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {property.propertyCity}, {property.propertyState} {property.propertyZip}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Divider />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Owner
              </Typography>
              <Typography variant="body1">
                {property.firstName || ''} {property.lastName || ''}
                {!property.firstName && !property.lastName && 'N/A'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Offer Amount
              </Typography>
              <Chip
                label={`$${property.offer.toLocaleString()}`}
                color="primary"
                sx={{ fontWeight: 'bold', fontSize: '1rem' }}
              />
            </Grid>
            
            {property.createdAt && (
              <>
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {new Date(property.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {property.updatedAt ? new Date(property.updatedAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyDetail;
