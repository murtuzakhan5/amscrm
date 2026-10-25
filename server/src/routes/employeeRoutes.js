import { Router } from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
} from '../controllers/employeeController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

// Employees listing & details accessible to all authenticated users with role-scoping
router.get('/', getEmployees);
router.get('/:id', getEmployeeById);

// Admin-only operations
router.post('/', authorizeRoles('admin'), createEmployee);
router.patch('/:id', authorizeRoles('admin'), updateEmployee);
router.patch('/:id/status', authorizeRoles('admin'), toggleEmployeeStatus);

export default router;
