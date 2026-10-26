import { Router } from 'express';
import {
  getDashboardStats,
  getEmployeeDashboardStats,
  getManagerDashboardStats,
} from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

// Admin & Manager dashboard aggregations
router.get('/dashboard', authorizeRoles('admin', 'manager'), getDashboardStats);

// Manager dashboard
router.get('/manager-dashboard', authorizeRoles('admin', 'manager'), getManagerDashboardStats);

// Employee personal dashboard
router.get('/employee-dashboard', getEmployeeDashboardStats);

export default router;
