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
                // Cache key
                const cacheKey = `property:${propertyId}:offers`;
                // Try to get from cache first
                const cachedOffers = yield redis_service_1.redisService.get(cacheKey);
                if (cachedOffers) {
                    return (0, responseHandler_1.sendResponse)(res, {
                        offers: cachedOffers,
                        fromCache: true
                    });
                }
                // Get offers from database
                const offers = yield repositories_1.offerHistoryRepository.findByPropertyId(parseInt(propertyId));
                // Transform to camelCase
                const camelCaseOffers = (0, dataTransformer_1.toCamelCase)(JSON.parse(JSON.stringify(offers)));
                // Cache for 5 minutes
                yield redis_service_1.redisService.set(cacheKey, camelCaseOffers, 300);
                // Log activity
                yield repositories_2.activityLogRepository.log({
                    action: 'view_offers',
                    entity_type: 'property',
                    entity_id: propertyId,
                    ip_address: req.ip
                });
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
                // Update offer
                const [numUpdated, [updatedOffer]] = yield repositories_1.offerHistoryRepository.update(parseInt(offerId), {
                    offerAmount,
                    offerDate
                });
                if (numUpdated === 0) {
                    return (0, responseHandler_1.sendResponse)(res, {
                        message: 'Offer not found'
                    }, 404);
                }
                // Invalidate cache for the property
                yield redis_service_1.redisService.delete(`property:${updatedOffer.property_id}:offers`);
                // Log activity
                yield repositories_2.activityLogRepository.log({
                    action: 'update_offer',
                    entity_type: 'property',
                    entity_id: updatedOffer.property_id.toString(),
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
