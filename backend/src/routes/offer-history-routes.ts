import { Router } from 'express';
import offerHistoryController from '../controllers/offer-history-controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Get all offers for a property
router.get('/property/:propertyId', asyncHandler(offerHistoryController.getPropertyOffers));

// Add a new offer to a property
router.post('/property/:propertyId', asyncHandler(offerHistoryController.addOffer));

// Update an existing offer
router.put('/:offerId', asyncHandler(offerHistoryController.updateOffer));

// Delete an offer
router.delete('/:offerId', asyncHandler(offerHistoryController.deleteOffer));

export default router; 