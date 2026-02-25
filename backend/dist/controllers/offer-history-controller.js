"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repositories_1 = require("../repositories");
const repositories_2 = require("../repositories");
const redis_service_1 = require("../services/redis-service");
const logger_1 = __importDefault(require("../logger"));
const dataTransformer_1 = require("../utils/dataTransformer");
const responseHandler_1 = require("../utils/responseHandler");
class OfferHistoryController {
    /**
     * Get offer history for a property
     * @param req Request object
     * @param res Response object
     */
    getPropertyOffers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { propertyId } = req.params;
                const propertyIdNum = parseInt(propertyId);
                if (isNaN(propertyIdNum)) {
                    return (0, responseHandler_1.sendResponse)(res, {
                        message: 'Invalid property ID'
                    }, 400);
                }
                // Cache key
                const cacheKey = `property:${propertyId}:offers`;
                // Try to get from cache first
                const cachedOffers = yield redis_service_1.redisService.get(cacheKey);
                if (cachedOffers) {
                    // Handle cached data - it might be a string that needs parsing
                    let parsedOffers = cachedOffers;
                    if (typeof cachedOffers === 'string') {
                        try {
                            parsedOffers = JSON.parse(cachedOffers);
                        }
                        catch (e) {
                            logger_1.default.warn(`Failed to parse cached offers for property ${propertyId}, fetching from database`);
                            parsedOffers = null;
                        }
                    }
                    if (parsedOffers !== null && parsedOffers !== undefined) {
                        // Format dates in cached data as date-only strings to ensure consistency
                        const formattedCachedOffers = Array.isArray(parsedOffers) ? parsedOffers.map((offer) => (Object.assign(Object.assign({}, offer), { offerDate: offer.offerDate ? (typeof offer.offerDate === 'string'
                                ? offer.offerDate.split('T')[0]
                                : new Date(offer.offerDate).toISOString().split('T')[0])
                                : offer.offerDate }))) : [];
                        logger_1.default.debug(`Returning cached offers for property ${propertyId}, count: ${formattedCachedOffers.length}`);
                        return (0, responseHandler_1.sendResponse)(res, {
                            offers: formattedCachedOffers,
                            fromCache: true
                        });
                    }
                }
                // Get offers from database
                logger_1.default.debug(`Fetching offers from database for property ${propertyId}`);
                const offers = yield repositories_1.offerHistoryRepository.findByPropertyId(propertyIdNum);
                logger_1.default.debug(`Found ${offers.length} offers in database for property ${propertyId}`);
                // Transform to camelCase and format dates as date-only strings (YYYY-MM-DD) to avoid timezone issues
                // Use Sequelize's toJSON and then format the date properly
                const camelCaseOffers = offers.map((offer) => {
                    // Convert to plain object first
                    const offerObj = offer.toJSON ? offer.toJSON() : offer;
                    // Get the offer_date value - prefer the raw string from database if available
                    let rawOfferDate = offerObj.offer_date_string || // Raw string from SQL TO_CHAR
                        offerObj.offer_date ||
                        offerObj.offerDate ||
                        (offer.dataValues && (offer.dataValues.offer_date_string || offer.dataValues.offer_date)) ||
                        offer.offer_date;
                    // Format the date as YYYY-MM-DD string
                    let formattedDate = '';
                    if (rawOfferDate) {
                        if (typeof rawOfferDate === 'string') {
                            // If it's already a string, extract just the date part (YYYY-MM-DD)
                            formattedDate = rawOfferDate.split('T')[0].split(' ')[0];
                        }
                        else if (rawOfferDate instanceof Date) {
                            // Use toISOString and extract date part - this ensures UTC
                            formattedDate = rawOfferDate.toISOString().split('T')[0];
                        }
                        else {
                            formattedDate = String(rawOfferDate).split('T')[0].split(' ')[0];
                        }
                    }
                    logger_1.default.debug(`Offer ${offerObj.id || 'unknown'}: raw date = ${rawOfferDate}, formatted = ${formattedDate}`);
                    return Object.assign(Object.assign({}, (0, dataTransformer_1.toCamelCase)(offerObj)), { offerDate: formattedDate });
                });
                // Cache for 5 minutes
                yield redis_service_1.redisService.set(cacheKey, camelCaseOffers, 300);
                // Log activity
                yield repositories_2.activityLogRepository.log({
                    action: 'view_offers',
                    entity_type: 'property',
                    entity_id: propertyId,
                    ip_address: req.ip
                });
                logger_1.default.info(`Sending offers for property ${propertyId}:`, JSON.stringify(camelCaseOffers.slice(0, 2), null, 2));
                return (0, responseHandler_1.sendResponse)(res, {
                    offers: camelCaseOffers
                });
            }
            catch (error) {
                logger_1.default.error(`Error fetching offers for property ${req.params.propertyId}:`, error);
                return (0, responseHandler_1.sendResponse)(res, {
                    message: 'Error fetching property offers'
                }, 500);
            }
        });
    }
    /**
     * Add a new offer to a property
     * @param req Request object
     * @param res Response object
     */
    addOffer(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { propertyId } = req.params;
                const { offerAmount, offerDate } = req.body;
                // Validate required fields
                if (!offerAmount || !offerDate) {
                    return (0, responseHandler_1.sendResponse)(res, {
                        message: 'Offer amount and date are required'
                    }, 400);
                }
                // Add offer
                const offer = yield repositories_1.offerHistoryRepository.addOffer({
                    propertyId: parseInt(propertyId),
                    offerAmount,
                    offerDate
                });
                // Invalidate cache
                yield redis_service_1.redisService.delete(`property:${propertyId}:offers`);
                // Log activity
                yield repositories_2.activityLogRepository.log({
                    action: 'add_offer',
                    entity_type: 'property',
                    entity_id: propertyId,
                    details: { offerAmount, offerDate },
                    ip_address: req.ip
                });
                // Transform to camelCase
                const camelCaseOffer = (0, dataTransformer_1.toCamelCase)(JSON.parse(JSON.stringify(offer)));
                return (0, responseHandler_1.sendResponse)(res, {
                    offer: camelCaseOffer
                }, 201);
            }
            catch (error) {
                logger_1.default.error(`Error adding offer for property ${req.params.propertyId}:`, error);
                return (0, responseHandler_1.sendResponse)(res, {
                    message: 'Error adding offer'
                }, 500);
            }
        });
    }
    /**
     * Update an existing offer
     * @param req Request object
     * @param res Response object
     */
    updateOffer(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { offerId } = req.params;
                const { offerAmount, offerDate } = req.body;
                // Validate required fields
                if (!offerAmount || !offerDate) {
                    return (0, responseHandler_1.sendResponse)(res, {
                        message: 'Offer amount and date are required'
                    }, 400);
                }
                // Get the offer first to get property_id for cache invalidation
                const existingOffer = yield repositories_1.offerHistoryRepository.findById(parseInt(offerId));
                if (!existingOffer) {
                    return (0, responseHandler_1.sendResponse)(res, {
                        message: 'Offer not found'
                    }, 404);
                }
                // Update offer with snake_case field names for database
                const [numUpdated, updatedOffers] = yield repositories_1.offerHistoryRepository.update(parseInt(offerId), {
                    offer_amount: offerAmount.toString(),
                    offer_date: new Date(offerDate)
                });
                if (numUpdated === 0) {
                    return (0, responseHandler_1.sendResponse)(res, {
                        message: 'Offer not found'
                    }, 404);
                }
                // Get the updated offer
                const updatedOffer = yield repositories_1.offerHistoryRepository.findById(parseInt(offerId));
                if (!updatedOffer) {
                    return (0, responseHandler_1.sendResponse)(res, {
                        message: 'Error retrieving updated offer'
                    }, 500);
                }
                // Invalidate cache for the property
                yield redis_service_1.redisService.delete(`property:${existingOffer.property_id}:offers`);
                // Log activity
                yield repositories_2.activityLogRepository.log({
                    action: 'update_offer',
                    entity_type: 'property',
                    entity_id: existingOffer.property_id.toString(),
                    details: { offerAmount, offerDate },
                    ip_address: req.ip
                });
                // Transform to camelCase
                const camelCaseOffer = (0, dataTransformer_1.toCamelCase)(JSON.parse(JSON.stringify(updatedOffer)));
                return (0, responseHandler_1.sendResponse)(res, {
                    offer: camelCaseOffer
                });
            }
            catch (error) {
                logger_1.default.error(`Error updating offer ${req.params.offerId}:`, error);
                return (0, responseHandler_1.sendResponse)(res, {
                    message: 'Error updating offer'
                }, 500);
            }
        });
    }
    /**
     * Delete an offer
     * @param req Request object
     * @param res Response object
     */
    deleteOffer(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { offerId } = req.params;
                // Get offer before deletion to get property ID for cache invalidation
                const offer = yield repositories_1.offerHistoryRepository.findById(parseInt(offerId));
                if (!offer) {
                    return (0, responseHandler_1.sendResponse)(res, {
                        message: 'Offer not found'
                    }, 404);
                }
                // Delete offer
                const deleted = yield repositories_1.offerHistoryRepository.delete(parseInt(offerId));
                if (!deleted) {
                    return (0, responseHandler_1.sendResponse)(res, {
                        message: 'Failed to delete offer'
                    }, 500);
                }
                // Invalidate cache
                yield redis_service_1.redisService.delete(`property:${offer.property_id}:offers`);
                // Log activity
                yield repositories_2.activityLogRepository.log({
                    action: 'delete_offer',
                    entity_type: 'property',
                    entity_id: offer.property_id.toString(),
                    details: {
                        offerAmount: offer.offer_amount,
                        offerDate: offer.offer_date
                    },
                    ip_address: req.ip
                });
                return (0, responseHandler_1.sendResponse)(res, {
                    message: 'Offer deleted successfully'
                });
            }
            catch (error) {
                logger_1.default.error(`Error deleting offer ${req.params.offerId}:`, error);
                return (0, responseHandler_1.sendResponse)(res, {
                    message: 'Error deleting offer'
                }, 500);
            }
        });
    }
}
exports.default = new OfferHistoryController();
