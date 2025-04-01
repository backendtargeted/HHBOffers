import { Router } from 'express';
import propertyController from '../controllers/property-controller';
import { propertyValidationRules, validateInput, searchValidationRules } from '../middleware/validateInput';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(propertyController.getAllProperties));

router.get('/search', searchValidationRules(), validateInput, asyncHandler(propertyController.searchProperties));

router.get('/:id', asyncHandler(propertyController.getPropertyById));

router.post(
  '/',
  propertyValidationRules(),
  validateInput,
  asyncHandler(propertyController.createProperty)
);

router.put(
  '/:id',
  propertyValidationRules(),
  validateInput,
  asyncHandler(propertyController.updateProperty)
);

router.post(
  '/batch',
  validateInput,
  asyncHandler(propertyController.batchUpdateProperties)
);

router.post(
  '/batch/create',
  validateInput,
  asyncHandler(propertyController.batchCreateProperties)
);

export default router;