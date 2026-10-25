import { Router } from 'express';
import {
  getDeals,
  getPipelineStages,
  createDeal,
  updateDeal,
} from '../controllers/dealController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getDeals);
router.get('/pipeline', getPipelineStages);
router.post('/', createDeal);
router.patch('/:id', updateDeal);

export default router;
