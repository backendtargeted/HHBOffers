import { Request, Response } from 'express';
import { offerHistoryRepository } from '../repositories';
import { activityLogRepository } from '../repositories';
import { redisService } from '../services/redis-service';
import logger from '../logger';
import { toCamelCase } from '../utils/dataTransformer';
import { sendResponse } from '../utils/responseHandler';

class OfferHistoryController {
  /**
   * Get offer history for a property
   * @param req Request object
   * @param res Response object
   */
  async getPropertyOffers(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const propertyIdNum = parseInt(propertyId);
      
      if (isNaN(propertyIdNum)) {
        return sendResponse(res, {
          message: 'Invalid property ID'
        }, 400);
      }
      
      // Cache key
      const cacheKey = `property:${propertyId}:offers`;
      
      // Try to get from cache first
      const cachedOffers = await redisService.get(cacheKey);
      if (cachedOffers) {
        // Handle cached data - it might be a string that needs parsing
        let parsedOffers = cachedOffers;
        if (typeof cachedOffers === 'string') {
          try {
            parsedOffers = JSON.parse(cachedOffers);
          } catch (e) {
            logger.warn(`Failed to parse cached offers for property ${propertyId}, fetching from database`);
            parsedOffers = null;
          }
        }
        
        if (parsedOffers !== null && parsedOffers !== undefined) {
          // Format dates in cached data as date-only strings to ensure consistency
          const formattedCachedOffers = Array.isArray(parsedOffers) ? parsedOffers.map((offer: any) => ({
            ...offer,
            offerDate: offer.offerDate ? (typeof offer.offerDate === 'string' 
              ? offer.offerDate.split('T')[0] 
              : new Date(offer.offerDate).toISOString().split('T')[0]) 
            : offer.offerDate
          })) : [];
          
          logger.debug(`Returning cached offers for property ${propertyId}, count: ${formattedCachedOffers.length}`);
          return sendResponse(res, {
            offers: formattedCachedOffers,
            fromCache: true
          });
        }
      }
      
      // Get offers from database
      logger.debug(`Fetching offers from database for property ${propertyId}`);
      const offers = await offerHistoryRepository.findByPropertyId(propertyIdNum);
      logger.debug(`Found ${offers.length} offers in database for property ${propertyId}`);
      
      // Transform to camelCase and format dates as date-only strings (YYYY-MM-DD) to avoid timezone issues
      // Use Sequelize's toJSON and then format the date properly
      const camelCaseOffers = offers.map((offer: any) => {
        // Convert to plain object first
        const offerObj = offer.toJSON ? offer.toJSON() : offer;
        
        // Get the offer_date value - prefer the raw string from database if available
        let rawOfferDate = offerObj.offer_date_string || // Raw string from SQL TO_CHAR
                          offerObj.offer_date || 
                          offerObj.offerDate || 
                          (offer.dataValues && (offer.dataValues.offer_date_string || offer.dataValues.offer_date)) || 
                          offer.offer_date;
        
        // Format the date as YYYY-MM-DD string
        let formattedDate: string = '';
        if (rawOfferDate) {
          if (typeof rawOfferDate === 'string') {
            // If it's already a string, extract just the date part (YYYY-MM-DD)
            formattedDate = rawOfferDate.split('T')[0].split(' ')[0];
          } else if (rawOfferDate instanceof Date) {
            // Use toISOString and extract date part - this ensures UTC
            formattedDate = rawOfferDate.toISOString().split('T')[0];
          } else {
            formattedDate = String(rawOfferDate).split('T')[0].split(' ')[0];
          }
        }
        
        logger.debug(`Offer ${offerObj.id || 'unknown'}: raw date = ${rawOfferDate}, formatted = ${formattedDate}`);
        
        return {
          ...toCamelCase(offerObj),
          offerDate: formattedDate
        };
      });
      
      // Cache for 5 minutes
      await redisService.set(cacheKey, camelCaseOffers, 300);
      
      // Log activity
      await activityLogRepository.log({
        action: 'view_offers',
        entity_type: 'property',
        entity_id: propertyId,
        ip_address: req.ip
      });
      
      return sendResponse(res, {
        offers: camelCaseOffers
      });
    } catch (error) {
      logger.error(`Error fetching offers for property ${req.params.propertyId}:`, error);
      return sendResponse(res, {
        message: 'Error fetching property offers'
      }, 500);
    }
  }

  /**
   * Add a new offer to a property
   * @param req Request object
   * @param res Response object
   */
  async addOffer(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const { offerAmount, offerDate } = req.body;
      
      // Validate required fields
      if (!offerAmount || !offerDate) {
        return sendResponse(res, {
          message: 'Offer amount and date are required'
        }, 400);
      }
      
      // Add offer
      const offer = await offerHistoryRepository.addOffer({
        propertyId: parseInt(propertyId),
        offerAmount,
        offerDate
      });
      
      // Invalidate cache
      await redisService.delete(`property:${propertyId}:offers`);
      
      // Log activity
      await activityLogRepository.log({
        action: 'add_offer',
        entity_type: 'property',
        entity_id: propertyId,
        details: { offerAmount, offerDate },
        ip_address: req.ip
      });
      
      // Transform to camelCase
      const camelCaseOffer = toCamelCase(JSON.parse(JSON.stringify(offer)));
      
      return sendResponse(res, {
        offer: camelCaseOffer
      }, 201);
    } catch (error) {
      logger.error(`Error adding offer for property ${req.params.propertyId}:`, error);
      return sendResponse(res, {
        message: 'Error adding offer'
      }, 500);
    }
  }

  /**
   * Update an existing offer
   * @param req Request object
   * @param res Response object
   */
  async updateOffer(req: Request, res: Response) {
    try {
      const { offerId } = req.params;
      const { offerAmount, offerDate } = req.body;
      
      // Validate required fields
      if (!offerAmount || !offerDate) {
        return sendResponse(res, {
          message: 'Offer amount and date are required'
        }, 400);
      }
      
      // Get the offer first to get property_id for cache invalidation
      const existingOffer = await offerHistoryRepository.findById(parseInt(offerId));
      if (!existingOffer) {
        return sendResponse(res, {
          message: 'Offer not found'
        }, 404);
      }
      
      // Update offer with snake_case field names for database
      const [numUpdated, updatedOffers] = await offerHistoryRepository.update(
        parseInt(offerId),
        {
          offer_amount: offerAmount.toString(),
          offer_date: new Date(offerDate)
        } as any
      );
      
      if (numUpdated === 0) {
        return sendResponse(res, {
          message: 'Offer not found'
        }, 404);
      }
      
      // Get the updated offer
      const updatedOffer = await offerHistoryRepository.findById(parseInt(offerId));
      if (!updatedOffer) {
        return sendResponse(res, {
          message: 'Error retrieving updated offer'
        }, 500);
      }
      
      // Invalidate cache for the property
      await redisService.delete(`property:${existingOffer.property_id}:offers`);
      
      // Log activity
      await activityLogRepository.log({
        action: 'update_offer',
        entity_type: 'property',
        entity_id: existingOffer.property_id.toString(),
        details: { offerAmount, offerDate },
        ip_address: req.ip
      });
      
      // Transform to camelCase
      const camelCaseOffer = toCamelCase(JSON.parse(JSON.stringify(updatedOffer)));
      
      return sendResponse(res, {
        offer: camelCaseOffer
      });
    } catch (error) {
      logger.error(`Error updating offer ${req.params.offerId}:`, error);
      return sendResponse(res, {
        message: 'Error updating offer'
      }, 500);
    }
  }

  /**
   * Delete an offer
   * @param req Request object
   * @param res Response object
   */
  async deleteOffer(req: Request, res: Response) {
    try {
      const { offerId } = req.params;
      
      // Get offer before deletion to get property ID for cache invalidation
      const offer = await offerHistoryRepository.findById(parseInt(offerId));
      
      if (!offer) {
        return sendResponse(res, {
          message: 'Offer not found'
        }, 404);
      }
      
      // Delete offer
      const deleted = await offerHistoryRepository.delete(parseInt(offerId));
      
      if (!deleted) {
        return sendResponse(res, {
          message: 'Failed to delete offer'
        }, 500);
      }
      
      // Invalidate cache
      await redisService.delete(`property:${offer.property_id}:offers`);
      
      // Log activity
      await activityLogRepository.log({
        action: 'delete_offer',
        entity_type: 'property',
        entity_id: offer.property_id.toString(),
        details: {
          offerAmount: offer.offer_amount,
          offerDate: offer.offer_date
        },
        ip_address: req.ip
      });
      
      return sendResponse(res, {
        message: 'Offer deleted successfully'
      });
    } catch (error) {
      logger.error(`Error deleting offer ${req.params.offerId}:`, error);
      return sendResponse(res, {
        message: 'Error deleting offer'
      }, 500);
    }
  }
}

export default new OfferHistoryController(); 