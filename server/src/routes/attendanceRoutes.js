import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyAttendance,
  getAllAttendance,
} from '../controllers/attendanceController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', getTodayStatus);
router.get('/my-history', getMyAttendance);

// Admin & Manager access all attendance logs
router.get('/all', authorizeRoles('admin', 'manager'), getAllAttendance);

export default router;
