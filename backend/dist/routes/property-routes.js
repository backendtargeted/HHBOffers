"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const property_controller_1 = __importDefault(require("../controllers/property-controller"));
const validateInput_1 = require("../middleware/validateInput");
const auth_middleware_1 = require("../middleware/auth-middleware");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, (0, asyncHandler_1.asyncHandler)(property_controller_1.default.getAllProperties));
/**
 * @route   GET /api/properties/search
 * @desc    Search properties with autocomplete
 * @access  Private
 */
router.get('/search', auth_middleware_1.authenticate, (0, validateInput_1.searchValidationRules)(), validateInput_1.validateInput, (0, asyncHandler_1.asyncHandler)(property_controller_1.default.searchProperties));
/**
 * @route   GET /api/properties/:id
 * @desc    Get property by ID
 * @access  Private
 */
router.get('/:id', auth_middleware_1.authenticate, (0, asyncHandler_1.asyncHandler)(property_controller_1.default.getPropertyById));
/**
 * @route   POST /api/properties
 * @desc    Create a new property
 * @access  Private - Admin, Manager
 */
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin', 'manager']), (0, validateInput_1.propertyValidationRules)(), validateInput_1.validateInput, (0, asyncHandler_1.asyncHandler)(property_controller_1.default.createProperty));
/**
 * @route   PUT /api/properties/:id
 * @desc    Update a property
 * @access  Private - Admin, Manager
 */
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin', 'manager']), (0, validateInput_1.propertyValidationRules)(), validateInput_1.validateInput, (0, asyncHandler_1.asyncHandler)(property_controller_1.default.updateProperty));
/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete a property
 * @access  Private - Admin only
 */
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), (0, asyncHandler_1.asyncHandler)(property_controller_1.default.deleteProperty));
/**
 * @route   POST /api/properties/batch
 * @desc    Batch update properties
 * @access  Private - Admin, Manager
 */
router.post('/batch', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin', 'manager']), (0, validateInput_1.batchPropertyValidationRules)(), validateInput_1.validateInput, (0, asyncHandler_1.asyncHandler)(property_controller_1.default.batchUpdateProperties));
/**
 * @route   POST /api/properties/batch/create
 * @desc    Batch create properties
 * @access  Private - Admin, Manager
 */
router.post('/batch/create', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin', 'manager']), (0, validateInput_1.batchPropertyCreationRules)(), validateInput_1.validateInput, (0, asyncHandler_1.asyncHandler)(property_controller_1.default.batchCreateProperties));
exports.default = router;
