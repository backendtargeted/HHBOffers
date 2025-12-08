import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { offerHistoryAPI } from '../../services/api';

// Define validation schema
const offerSchema = yup.object({
  offerAmount: yup
    .number()
    .required('Offer amount is required')
    .min(0, 'Offer amount cannot be negative'),
  offerDate: yup
    .string()
    .required('Offer date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
}).required();

// Define TypeScript interfaces
interface Offer {
  id: number;
  propertyId: number;
  offerAmount: number;
  offerDate: string;
  createdAt: string;
}

interface OfferHistoryProps {
  propertyId: number;
  isMobile?: boolean;
}

const OfferHistory: React.FC<OfferHistoryProps> = ({ propertyId, isMobile = false }) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down('sm')) || isMobile;

  // Setup form
  const { control: addControl, handleSubmit: handleAddSubmit, reset: resetAddForm } = useForm({
    resolver: yupResolver(offerSchema),
    defaultValues: {
      offerAmount: 0,
      offerDate: new Date().toISOString().split('T')[0]
    }
  });

  const { control: editControl, handleSubmit: handleEditSubmit, reset: resetEditForm } = useForm({
    resolver: yupResolver(offerSchema)
  });

  // Fetch offers
  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await offerHistoryAPI.getPropertyOffers(propertyId);
      setOffers(response.offers);
    } catch (error) {
      setError('Failed to fetch offer history');
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [propertyId]);

  // Handle add offer
  const onAddOffer = async (data: { offerAmount: number; offerDate: string }) => {
    try {
      setError(null);
      setSuccess(null);
      await offerHistoryAPI.addOffer(propertyId, data);
      setSuccess('Offer added successfully');
      setIsAddDialogOpen(false);
      resetAddForm();
      fetchOffers();
    } catch (error) {
      setError('Failed to add offer');
      console.error('Error adding offer:', error);
    }
  };

  // Handle edit offer
  const onEditOffer = async (data: { offerAmount: number; offerDate: string }) => {
    if (!selectedOffer) return;

    try {
      setError(null);
      setSuccess(null);
      await offerHistoryAPI.updateOffer(selectedOffer.id, data);
      setSuccess('Offer updated successfully');
      setIsEditDialogOpen(false);
      resetEditForm();
      fetchOffers();
    } catch (error) {
      setError('Failed to update offer');
      console.error('Error updating offer:', error);
    }
  };

  // Handle delete offer
  const onDeleteOffer = async (offerId: number) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;

    try {
      setError(null);
      setSuccess(null);
      await offerHistoryAPI.deleteOffer(offerId);
      setSuccess('Offer deleted successfully');
      fetchOffers();
    } catch (error) {
      setError('Failed to delete offer');
      console.error('Error deleting offer:', error);
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

  // Format date - handle date-only values correctly to avoid timezone issues
  const formatDate = (dateString: string) => {
    console.log('formatDate input:', dateString);
    // Extract just the date part (YYYY-MM-DD) if it includes time
    const dateOnly = dateString.split('T')[0];
    const [year, month, day] = dateOnly.split('-').map(Number);

    // Use UTC date and explicitly format in UTC timezone to avoid conversion issues
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    return utcDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC' // Explicitly use UTC timezone
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card elevation={3}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2">
            Offer History
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddDialogOpen(true)}
            size={isMobileView ? "medium" : "small"}
          >
            Add Offer
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <TableContainer component={Paper} variant="outlined">
          <Table size={isMobileView ? "medium" : "small"}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {offers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No offers found
                  </TableCell>
                </TableRow>
              ) : (
                offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>{formatDate(offer.offerDate)}</TableCell>
                    <TableCell align="right">{formatCurrency(offer.offerAmount)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedOffer(offer);
                          resetEditForm({
                            offerAmount: offer.offerAmount,
                            offerDate: offer.offerDate
                          });
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onDeleteOffer(offer.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add Offer Dialog */}
        <Dialog
          open={isAddDialogOpen}
          onClose={() => {
            setIsAddDialogOpen(false);
            resetAddForm();
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add New Offer</DialogTitle>
          <form onSubmit={handleAddSubmit(onAddOffer)}>
            <DialogContent>
              <Controller
                name="offerAmount"
                control={addControl}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Offer Amount"
                    type="number"
                    fullWidth
                    margin="normal"
                    error={!!error}
                    helperText={error?.message}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                    }}
                  />
                )}
              />
              <Controller
                name="offerDate"
                control={addControl}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Offer Date"
                    type="date"
                    fullWidth
                    margin="normal"
                    error={!!error}
                    helperText={error?.message}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetAddForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="contained">
                Add Offer
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Edit Offer Dialog */}
        <Dialog
          open={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            resetEditForm();
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Offer</DialogTitle>
          <form onSubmit={handleEditSubmit(onEditOffer)}>
            <DialogContent>
              <Controller
                name="offerAmount"
                control={editControl}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Offer Amount"
                    type="number"
                    fullWidth
                    margin="normal"
                    error={!!error}
                    helperText={error?.message}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                    }}
                  />
                )}
              />
              <Controller
                name="offerDate"
                control={editControl}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Offer Date"
                    type="date"
                    fullWidth
                    margin="normal"
                    error={!!error}
                    helperText={error?.message}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetEditForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="contained">
                Update Offer
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default OfferHistory;