import { Router } from 'express';
import propertyController from '../controllers/property-controller';
import { propertyValidationRules, validateInput, searchValidationRules, batchPropertyValidationRules, batchPropertyCreationRules } from '../middleware/validateInput';
import { authenticate, authorize } from '../middleware/auth-middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', authenticate, asyncHandler(propertyController.getAllProperties));

/**
 * @route   GET /api/properties/search
 * @desc    Search properties with autocomplete
 * @access  Private
 */
router.get('/search', authenticate, searchValidationRules(), validateInput, asyncHandler(propertyController.searchProperties));

/**
 * @route   GET /api/properties/:id
 * @desc    Get property by ID
 * @access  Private
 */
router.get('/:id', authenticate, asyncHandler(propertyController.getPropertyById));

/**
 * @route   POST /api/properties
 * @desc    Create a new property
 * @access  Private - Admin, Manager
 */
router.post(
  '/',
  authenticate,
  authorize(['admin', 'manager']),
  propertyValidationRules(),
  validateInput,
  asyncHandler(propertyController.createProperty)
);

/**
 * @route   PUT /api/properties/:id
 * @desc    Update a property
 * @access  Private - Admin, Manager
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'manager']),
  propertyValidationRules(),
  validateInput,
  asyncHandler(propertyController.updateProperty)
);

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete a property
 * @access  Private - Admin only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  asyncHandler(propertyController.deleteProperty)
);

/**
 * @route   POST /api/properties/batch
 * @desc    Batch update properties
 * @access  Private - Admin, Manager
 */
router.post(
  '/batch',
  authenticate,
  authorize(['admin', 'manager']),
  batchPropertyValidationRules(),
  validateInput,
  asyncHandler(propertyController.batchUpdateProperties)
);

/**
 * @route   POST /api/properties/batch/create
 * @desc    Batch create properties
 * @access  Private - Admin, Manager
 */
router.post(
  '/batch/create',
  authenticate,
  authorize(['admin', 'manager']),
  batchPropertyCreationRules(),
  validateInput,
  asyncHandler(propertyController.batchCreateProperties)
);

export default router;