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
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Stack
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Define validation schema
const propertyUpdateSchema = yup.object({
  id: yup.number().required('ID is required'),
  firstName: yup.string().optional().nullable(),
  lastName: yup.string().optional().nullable(),
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
  createdAt: yup.string().optional().nullable(),
  updatedAt: yup.string().optional().nullable()
}).required();

// Define TypeScript interfaces
export interface Property {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  offer: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface PropertyDetailProps {
  property: Property | any; // Accept any to handle both snake_case and camelCase
  onUpdate?: (id: number, data: Partial<Property>) => Promise<Property>;
  onBack?: () => void;
  editable?: boolean;
  isLoading?: boolean;
  isMobile?: boolean; // Add isMobile prop
}

const PropertyDetail: React.FC<PropertyDetailProps> = ({
  property,
  onUpdate,
  onBack,
  editable = false,
  isLoading = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Check if object is in snake_case and convert to camelCase if needed
  const normalizeProperty = (prop: any): Property => {
    // If the property has snake_case properties, convert to camelCase
    if (prop.property_address || prop.first_name) {
      return {
        id: prop.id,
        firstName: prop.first_name || null,
        lastName: prop.last_name || null,
        propertyAddress: prop.property_address || '',
        propertyCity: prop.property_city || '',
        propertyState: prop.property_state || '',
        propertyZip: prop.property_zip || '',
        offer: prop.offer || 0,
        createdAt: prop.created_at || null,
        updatedAt: prop.updated_at || null
      };
    }
    // Return already camelCase properties
    return property as Property;
  };

  // Make sure property values are defined before using them
  const safeProperty = normalizeProperty(property);

  // Format currency function... (Assuming it exists or will be added if needed)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Add additional mobile styling
  const mobileStyles = {
    heading: {
      fontSize: isMobile ? '1.25rem' : '1.5rem',
      fontWeight: 'bold',
      mb: 1
    },
    subheading: {
      fontSize: isMobile ? '1rem' : '1.1rem',
      color: 'text.secondary',
      mb: 2
    },
    sectionTitle: {
      fontSize: '0.875rem',
      color: 'text.secondary',
      mt: 2,
      mb: 0.5
    },
    sectionContent: {
      fontSize: isMobile ? '1.1rem' : '1rem',
      fontWeight: 'medium',
      mb: 2
    },
    chip: {
      fontSize: isMobile ? '1.1rem' : '1rem',
      py: 1.5,
      height: 'auto'
    },
    button: {
      py: isMobile ? 1 : undefined
    }
  };

  // Setup form
  const { control, handleSubmit, formState: { errors } } = useForm<Property>({
    resolver: yupResolver(propertyUpdateSchema),
    defaultValues: safeProperty
  });

  // Handle form submission
  const onSubmit = async (data: Property) => {
    if (!onUpdate) return;

    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      await onUpdate(safeProperty.id, data);
      setIsEditing(false);
      setUpdateSuccess(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUpdateError(errorMessage);
    }
  };

  if (!property || !property.id) {
    return (
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h5" component="h2">
            Property Details
          </Typography>
          <Typography color="textSecondary" mt={2}>
            No property selected or property data is invalid.
          </Typography>
          {onBack && (
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={onBack}
              sx={{ mt: 2 }}
            >
              Back to Properties
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Corrected return structure based on user feedback
  return (
    <Card elevation={3}>
      <CardContent sx={{ p: isMobile ? 3 : 2 }}>
        {/* Title */}
        <Typography variant="h6" component="h2" gutterBottom>
          Property Details
        </Typography>

        {/* Action Buttons */}
        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={2}
          sx={{ mb: 3 }}
        >
          {onBack && (
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={onBack}
              variant="outlined"
              fullWidth={isMobile}
              sx={mobileStyles.button}
            >
              BACK
            </Button>
          )}
          {editable && !isEditing && (
            <Button
              startIcon={<EditIcon />}
              variant="outlined"
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
              fullWidth={isMobile}
              sx={mobileStyles.button}
            >
              EDIT
            </Button>
          )}
        </Stack>

        {/* Success Alert - Moved below buttons for consistency */}
        {updateSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Property updated successfully!
          </Alert>
        )}

        {/* Main Content */}
        {isEditing ? (
          // Edit Mode (Apply responsive spacing)
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={isMobile ? 1 : 2}> {/* Updated spacing */}
              {/* Form Fields */}
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
                      size={isMobile ? "medium" : "small"} // Add responsive size
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                      value={field.value || ''}
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
                      size={isMobile ? "medium" : "small"} // Add responsive size
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                      value={field.value || ''}
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
                      size={isMobile ? "medium" : "small"} // Add responsive size
                      error={!!errors.propertyAddress}
                      helperText={errors.propertyAddress?.message}
                      value={field.value || ''}
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
                      size={isMobile ? "medium" : "small"} // Add responsive size
                      error={!!errors.propertyCity}
                      helperText={errors.propertyCity?.message}
                      value={field.value || ''}
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
                      size={isMobile ? "medium" : "small"} // Add responsive size
                      inputProps={{ maxLength: 2 }}
                      error={!!errors.propertyState}
                      helperText={errors.propertyState?.message}
                      value={field.value || ''}
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
                      size={isMobile ? "medium" : "small"} // Add responsive size
                      error={!!errors.propertyZip}
                      helperText={errors.propertyZip?.message}
                      value={field.value || ''}
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
                      size={isMobile ? "medium" : "small"} // Add responsive size
                      type="number"
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                      }}
                      error={!!errors.offer}
                      helperText={errors.offer?.message}
                      value={field.value || 0}
                    />
                  )}
                />
              </Grid>

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  mt: 2
                }}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => setIsEditing(false)}
                    disabled={isLoading}
                    fullWidth={isMobile} // Use isMobile here
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={isLoading}
                    fullWidth={isMobile} // Use isMobile here
                  >
                    Save
                  </Button>
                </Box>
              </Grid>
            </Grid> {/* End Form Fields Grid */}

            {updateError && (
              <Box sx={{ mt: 2 }}>
                <Typography color="error">{updateError}</Typography>
              </Box>
            )}
          </Box> // End Edit Mode Box
        ) : (
          /* View Mode */
          /* Replace existing Box with Grid structure from plan */
          <Grid item xs={12}> 
            <Grid container spacing={isMobile ? 1 : 2}> {/* Responsive spacing */}
              {/* Property Information */}
              <Grid item xs={12}>
                <Typography variant={isMobile ? "body1" : "h6"}> {/* Responsive variant */}
                  {safeProperty.propertyAddress}
                </Typography>
                <Typography variant="body2" color="textSecondary"> {/* Use body2 as per plan */}
                  {safeProperty.propertyCity}, {safeProperty.propertyState} {safeProperty.propertyZip}
                </Typography>
              </Grid>

              <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid> {/* Add divider */}

              {/* Owner Info */}
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="textSecondary">Owner</Typography>
                <Typography variant={isMobile ? "body1" : "body1"}> {/* Consistent body1 */}
                  {(safeProperty.firstName || safeProperty.lastName) ?
                    `${safeProperty.firstName || ''} ${safeProperty.lastName || ''}`.trim() :
                    'Current Homeowner'}
                </Typography>
              </Grid>

              {/* Offer Amount */}
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="textSecondary">Offer Amount</Typography>
                <Chip
                  label={formatCurrency(safeProperty.offer)}
                  color="primary"
                  size={isMobile ? "medium" : "small"} // Responsive size
                  sx={{ mt: 0.5 }}
                />
              </Grid>

              {/* Dates */}
              {safeProperty.createdAt && (
                <>
                  <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Created</Typography>
                    <Typography variant={isMobile ? "body2" : "body2"}> {/* Consistent body2 */}
                      {new Date(safeProperty.createdAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Last Updated</Typography>
                    <Typography variant={isMobile ? "body2" : "body2"}> {/* Consistent body2 */}
                      {safeProperty.updatedAt ? new Date(safeProperty.updatedAt).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid> {/* End Inner View Mode Grid */}
          </Grid> // End Outer View Mode Grid Item
        )} {/* End isEditing ternary */}
      </CardContent>
    </Card>
  ); // End return statement
}; // End component function

export default PropertyDetail;
