import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  addMilestone,
} from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', authorizeRoles('admin', 'manager'), createProject);
router.patch('/:id', authorizeRoles('admin', 'manager'), updateProject);
router.post('/:id/milestones', authorizeRoles('admin', 'manager'), addMilestone);

export default router;
