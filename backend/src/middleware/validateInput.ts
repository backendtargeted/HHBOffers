import { Request, Response, NextFunction, RequestHandler } from 'express';
import { validationResult, body, param, query, ValidationChain } from 'express-validator';
import logger from '../logger';

/**
 * Express middleware for input validation and sanitization
 * This helps prevent SQL injection and other input-based attacks
 */
export const validateInput: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Validation errors: ${JSON.stringify(errors.array())}`);
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

/**
 * Property search validation rules
 * Used for autocomplete and search endpoints
 */
export const searchValidationRules = (): ValidationChain[] => [
  // Sanitize the search query parameter
  query('q').trim().escape(),
  
  // Validate and convert pagination parameters
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  
  // Validate sorting parameters
  query('sortBy').optional().trim().escape(),
  query('sortOrder').optional().isIn(['asc', 'desc']).trim()
];

/**
 * Property validation rules
 * Used for property creation and update endpoints
 */
export const propertyValidationRules = (): ValidationChain[] => [
  // Optional name fields
  body('firstName').optional().trim().escape(),
  body('lastName').optional().trim().escape(),
  
  // Required property fields with appropriate sanitization
  body('propertyAddress').notEmpty().trim().escape()
    .withMessage('Property address is required'),
    
  body('propertyCity').notEmpty().trim().escape()
    .withMessage('Property city is required'),
    
  body('propertyState').notEmpty().isLength({ min: 2, max: 2 }).trim().escape()
    .withMessage('Property state must be a valid 2-letter state code'),
    
  body('propertyZip').notEmpty().trim().escape()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Property zip must be a valid 5-digit or 5+4-digit ZIP code'),
    
  body('offer').isNumeric().toFloat()
    .withMessage('Offer must be a valid number')
];

/**
 * File upload validation rules
 * Used for file upload endpoints
 */
export const fileUploadValidationRules = (): ValidationChain[] => [
  // Ensure fileType is either csv or xlsx
  body('fileType').notEmpty().isIn(['csv', 'xlsx'])
    .withMessage('File type must be csv or xlsx')
];

/**
 * User creation validation rules
 * Used for user registration endpoint
 */
export const userValidationRules = (): ValidationChain[] => [
  body('email').isEmail().normalizeEmail()
    .withMessage('Must be a valid email address'),
    
  body('password').isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),
    
  body('name').notEmpty().trim().escape()
    .withMessage('Name is required'),
    
  body('role').optional().isIn(['admin', 'user'])
    .withMessage('Role must be either admin or user')
];

/**
 * Login validation rules
 * Used for the login endpoint
 */
export const loginValidationRules = (): ValidationChain[] => [
  body('email').isEmail().normalizeEmail()
    .withMessage('Must be a valid email address'),
    
  body('password').notEmpty()
    .withMessage('Password is required')
];

/**
 * Batch property update validation rules
 */
export const batchPropertyValidationRules = (): ValidationChain[] => [
  body('properties')
    .isArray()
    .withMessage('Properties must be an array')
    .notEmpty()
    .withMessage('Properties array cannot be empty'),
  
  body('properties.*.id')
    .exists()
    .withMessage('Each property must have an ID')
    .isInt()
    .withMessage('Property ID must be an integer'),
  
  body('properties.*.propertyAddress')
    .optional()
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Property address cannot be empty if provided'),
    
  body('properties.*.propertyCity')
    .optional()
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Property city cannot be empty if provided'),
    
  body('properties.*.propertyState')
    .optional()
    .isLength({ min: 2, max: 2 })
    .trim()
    .escape()
    .withMessage('Property state must be a valid 2-letter state code'),
    
  body('properties.*.propertyZip')
    .optional()
    .trim()
    .escape()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Property zip must be a valid 5-digit or 5+4-digit ZIP code'),
    
  body('properties.*.offer')
    .optional()
    .isNumeric()
    .withMessage('Offer must be a valid number')
];


/**
 * Batch property creation validation rules
 */
export const batchPropertyCreationRules = (): ValidationChain[] => [
  body('properties')
    .isArray()
    .withMessage('Properties must be an array')
    .notEmpty()
    .withMessage('Properties array cannot be empty'),
  
  body('properties.*.propertyAddress')
    .exists()
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Property address is required'),
    
  body('properties.*.propertyCity')
    .exists()
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Property city is required'),
    
  body('properties.*.propertyState')
    .exists()
    .isLength({ min: 2, max: 2 })
    .trim()
    .escape()
    .withMessage('Property state must be a valid 2-letter state code'),
    
  body('properties.*.propertyZip')
    .exists()
    .trim()
    .escape()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Property zip must be a valid 5-digit or 5+4-digit ZIP code'),
    
  body('properties.*.offer')
    .exists()
    .isNumeric()
    .withMessage('Offer must be a valid number')
];

// Example usage in route definitions:
// app.get('/api/properties/search', searchValidationRules(), validateInput, searchController.autocomplete);
// app.post('/api/properties', propertyValidationRules(), validateInput, propertiesController.create);
// app.post('/api/uploads', fileUploadValidationRules(), validateInput, uploadsController.upload);
// app.post('/api/users', userValidationRules(), validateInput, usersController.create);
// app.post('/api/auth/login', loginValidationRules(), validateInput, authController.login);
