import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
import OfferHistory from './OfferHistory';

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
  createdAt?: string | null;
  updatedAt?: string | null;
  offerHistories?: Array<{
    id: number;
    propertyId: number;
    offerAmount: number;
    offerDate: string;
    createdAt: string;
  }>;
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
    if (amount === 0) {
      return 'Please Call'; // or 'No Offer Made'
    }
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
  const { control, handleSubmit, formState: { errors }, reset } = useForm<Property>({
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
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: isMobile ? 1 : 2 }}>
              {/* Form Fields */}
              <Box>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="First Name"
                      fullWidth
                      margin="normal"
                      size={isMobile ? "medium" : "small"}
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                      value={field.value || ''}
                    />
                  )}
                />
              </Box>
              <Box>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Last Name"
                      fullWidth
                      margin="normal"
                      size={isMobile ? "medium" : "small"}
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                      value={field.value || ''}
                    />
                  )}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
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
                      size={isMobile ? "medium" : "small"}
                      error={!!errors.propertyAddress}
                      helperText={errors.propertyAddress?.message}
                      value={field.value || ''}
                    />
                  )}
                />
              </Box>
              <Box>
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
                      size={isMobile ? "medium" : "small"}
                      error={!!errors.propertyCity}
                      helperText={errors.propertyCity?.message}
                      value={field.value || ''}
                    />
                  )}
                />
              </Box>
              <Box>
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
                      size={isMobile ? "medium" : "small"}
                      inputProps={{ maxLength: 2 }}
                      error={!!errors.propertyState}
                      helperText={errors.propertyState?.message}
                      value={field.value || ''}
                    />
                  )}
                />
              </Box>
              <Box>
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
                      size={isMobile ? "medium" : "small"}
                      error={!!errors.propertyZip}
                      helperText={errors.propertyZip?.message}
                      value={field.value || ''}
                    />
                  )}
                />
              </Box>

              {/* Action Buttons */}
              <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  mt: 2
                }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    fullWidth={isMobile}
                    sx={mobileStyles.button}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => {
                      setIsEditing(false);
                      reset(safeProperty);
                    }}
                    fullWidth={isMobile}
                    sx={mobileStyles.button}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Box>

            {updateError && (
              <Box sx={{ mt: 2 }}>
                <Typography color="error">{updateError}</Typography>
              </Box>
            )}
          </Box>
        ) : (
          /* View Mode */
          <Box>
            <Stack spacing={2}>
              {/* Property Details */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={mobileStyles.sectionTitle}>
                  Property Details
                </Typography>
                <Typography variant="body1" sx={mobileStyles.sectionContent}>
                  {safeProperty.propertyAddress}
                </Typography>
                <Typography variant="body1" sx={mobileStyles.sectionContent}>
                  {`${safeProperty.propertyCity}, ${safeProperty.propertyState} ${safeProperty.propertyZip}`}
                </Typography>
              </Box>

              {/* Owner Information */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={mobileStyles.sectionTitle}>
                  Owner Information
                </Typography>
                <Typography variant="body1" sx={mobileStyles.sectionContent}>
                  {safeProperty.firstName || safeProperty.lastName
                    ? `${safeProperty.firstName || ''} ${safeProperty.lastName || ''}`.trim()
                    : 'Not provided'}
                </Typography>
              </Box>

              {/* Offer History */}
              <Box>
                <OfferHistory propertyId={safeProperty.id} isMobile={isMobile} />
              </Box>

              {/* Timestamps */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={mobileStyles.sectionTitle}>
                  Last Updated
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {safeProperty.updatedAt
                    ? new Date(safeProperty.updatedAt).toLocaleString()
                    : 'Not available'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyDetail;
