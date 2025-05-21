"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const offer_history_controller_1 = __importDefault(require("../controllers/offer-history-controller"));
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
// Get all offers for a property
router.get('/property/:propertyId', (0, asyncHandler_1.asyncHandler)(offer_history_controller_1.default.getPropertyOffers));
// Add a new offer to a property
router.post('/property/:propertyId', (0, asyncHandler_1.asyncHandler)(offer_history_controller_1.default.addOffer));
// Update an existing offer
router.put('/:offerId', (0, asyncHandler_1.asyncHandler)(offer_history_controller_1.default.updateOffer));
// Delete an offer
router.delete('/:offerId', (0, asyncHandler_1.asyncHandler)(offer_history_controller_1.default.deleteOffer));
exports.default = router;
