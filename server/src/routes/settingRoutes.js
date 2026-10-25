import { Router } from 'express';
import {
  getCompanySettings,
  updateCompanySettings,
} from '../controllers/companySettingsController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getCompanySettings);
router.patch('/', authorizeRoles('admin'), updateCompanySettings);

export default router;
