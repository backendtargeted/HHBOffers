"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchPropertyCreationRules = exports.batchPropertyValidationRules = exports.loginValidationRules = exports.userValidationRules = exports.fileUploadValidationRules = exports.propertyValidationRules = exports.searchValidationRules = exports.validateInput = void 0;
const express_validator_1 = require("express-validator");
const logger_1 = __importDefault(require("../logger"));
/**
 * Express middleware for input validation and sanitization
 * This helps prevent SQL injection and other input-based attacks
 */
const validateInput = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        logger_1.default.warn(`Validation errors: ${JSON.stringify(errors.array())}`);
        res.status(400).json({ errors: errors.array() });
        return;
    }
    next();
};
exports.validateInput = validateInput;
/**
 * Property search validation rules
 * Used for autocomplete and search endpoints
 */
const searchValidationRules = () => [
    // Sanitize the search query parameter
    (0, express_validator_1.query)('q').trim().escape(),
    // Validate and convert pagination parameters
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    // Validate sorting parameters
    (0, express_validator_1.query)('sortBy').optional().trim().escape(),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']).trim()
];
exports.searchValidationRules = searchValidationRules;
/**
 * Property validation rules
 * Used for property creation and update endpoints
 */
const propertyValidationRules = () => [
    // Optional name fields
    (0, express_validator_1.body)('firstName').optional().trim().escape(),
    (0, express_validator_1.body)('lastName').optional().trim().escape(),
    // Required property fields with appropriate sanitization
    (0, express_validator_1.body)('propertyAddress').notEmpty().trim().escape()
        .withMessage('Property address is required'),
    (0, express_validator_1.body)('propertyCity').notEmpty().trim().escape()
        .withMessage('Property city is required'),
    (0, express_validator_1.body)('propertyState').notEmpty().isLength({ min: 2, max: 2 }).trim().escape()
        .withMessage('Property state must be a valid 2-letter state code'),
    (0, express_validator_1.body)('propertyZip').notEmpty().trim().escape()
        .matches(/^\d{5}(-\d{4})?$/)
        .withMessage('Property zip must be a valid 5-digit or 5+4-digit ZIP code'),
    (0, express_validator_1.body)('offer').isNumeric().toFloat()
        .withMessage('Offer must be a valid number')
];
exports.propertyValidationRules = propertyValidationRules;
/**
 * File upload validation rules
 * Used for file upload endpoints
 */
const fileUploadValidationRules = () => [
    // Ensure fileType is either csv or xlsx
    (0, express_validator_1.body)('fileType').notEmpty().isIn(['csv', 'xlsx'])
        .withMessage('File type must be csv or xlsx')
];
exports.fileUploadValidationRules = fileUploadValidationRules;
/**
 * User creation validation rules
 * Used for user registration endpoint
 */
const userValidationRules = () => [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail()
        .withMessage('Must be a valid email address'),
    (0, express_validator_1.body)('password').isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),
    (0, express_validator_1.body)('name').notEmpty().trim().escape()
        .withMessage('Name is required'),
    (0, express_validator_1.body)('role').optional().isIn(['admin', 'user'])
        .withMessage('Role must be either admin or user')
];
exports.userValidationRules = userValidationRules;
/**
 * Login validation rules
 * Used for the login endpoint
 */
const loginValidationRules = () => [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail()
        .withMessage('Must be a valid email address'),
    (0, express_validator_1.body)('password').notEmpty()
        .withMessage('Password is required')
];
exports.loginValidationRules = loginValidationRules;
/**
 * Batch property update validation rules
 */
const batchPropertyValidationRules = () => [
    (0, express_validator_1.body)('properties')
        .isArray()
        .withMessage('Properties must be an array')
        .notEmpty()
        .withMessage('Properties array cannot be empty'),
    (0, express_validator_1.body)('properties.*.id')
        .exists()
        .withMessage('Each property must have an ID')
        .isInt()
        .withMessage('Property ID must be an integer'),
    (0, express_validator_1.body)('properties.*.propertyAddress')
        .optional()
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Property address cannot be empty if provided'),
    (0, express_validator_1.body)('properties.*.propertyCity')
        .optional()
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Property city cannot be empty if provided'),
    (0, express_validator_1.body)('properties.*.propertyState')
        .optional()
        .isLength({ min: 2, max: 2 })
        .trim()
        .escape()
        .withMessage('Property state must be a valid 2-letter state code'),
    (0, express_validator_1.body)('properties.*.propertyZip')
        .optional()
        .trim()
        .escape()
        .matches(/^\d{5}(-\d{4})?$/)
        .withMessage('Property zip must be a valid 5-digit or 5+4-digit ZIP code'),
    (0, express_validator_1.body)('properties.*.offer')
        .optional()
        .isNumeric()
        .withMessage('Offer must be a valid number')
];
exports.batchPropertyValidationRules = batchPropertyValidationRules;
/**
 * Batch property creation validation rules
 */
const batchPropertyCreationRules = () => [
    (0, express_validator_1.body)('properties')
        .isArray()
        .withMessage('Properties must be an array')
        .notEmpty()
        .withMessage('Properties array cannot be empty'),
    (0, express_validator_1.body)('properties.*.propertyAddress')
        .exists()
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Property address is required'),
    (0, express_validator_1.body)('properties.*.propertyCity')
        .exists()
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Property city is required'),
    (0, express_validator_1.body)('properties.*.propertyState')
        .exists()
        .isLength({ min: 2, max: 2 })
        .trim()
        .escape()
        .withMessage('Property state must be a valid 2-letter state code'),
    (0, express_validator_1.body)('properties.*.propertyZip')
        .exists()
        .trim()
        .escape()
        .matches(/^\d{5}(-\d{4})?$/)
        .withMessage('Property zip must be a valid 5-digit or 5+4-digit ZIP code'),
    (0, express_validator_1.body)('properties.*.offer')
        .exists()
        .isNumeric()
        .withMessage('Offer must be a valid number')
];
exports.batchPropertyCreationRules = batchPropertyCreationRules;
// Example usage in route definitions:
// app.get('/api/properties/search', searchValidationRules(), validateInput, searchController.autocomplete);
// app.post('/api/properties', propertyValidationRules(), validateInput, propertiesController.create);
// app.post('/api/uploads', fileUploadValidationRules(), validateInput, uploadsController.upload);
// app.post('/api/users', userValidationRules(), validateInput, usersController.create);
// app.post('/api/auth/login', loginValidationRules(), validateInput, authController.login);
