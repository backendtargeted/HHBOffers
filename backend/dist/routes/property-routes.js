"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const property_controller_1 = __importDefault(require("../controllers/property-controller"));
const validateInput_1 = require("../middleware/validateInput");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.get('/', (0, asyncHandler_1.asyncHandler)(property_controller_1.default.getAllProperties));
router.get('/search', (0, validateInput_1.searchValidationRules)(), validateInput_1.validateInput, (0, asyncHandler_1.asyncHandler)(property_controller_1.default.searchProperties));
router.get('/:id', (0, asyncHandler_1.asyncHandler)(property_controller_1.default.getPropertyById));
router.post('/', (0, validateInput_1.propertyValidationRules)(), validateInput_1.validateInput, (0, asyncHandler_1.asyncHandler)(property_controller_1.default.createProperty));
router.put('/:id', (0, validateInput_1.propertyValidationRules)(), validateInput_1.validateInput, (0, asyncHandler_1.asyncHandler)(property_controller_1.default.updateProperty));
router.post('/batch', validateInput_1.validateInput, (0, asyncHandler_1.asyncHandler)(property_controller_1.default.batchUpdateProperties));
router.post('/batch/create', validateInput_1.validateInput, (0, asyncHandler_1.asyncHandler)(property_controller_1.default.batchCreateProperties));
exports.default = router;
