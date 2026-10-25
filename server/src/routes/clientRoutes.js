import { Router } from 'express';
import {
  getClients,
  getClientCalendar,
  getClientById,
  createClient,
  updateClient,
  scheduleClientCall,
  addClientNote,
  completeClientFollowUp,
} from '../controllers/clientController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getClients);
router.get('/calendar', getClientCalendar);
router.get('/:id', getClientById);
router.post('/', authorizeRoles('admin', 'manager', 'employee'), createClient);
router.patch('/:id', authorizeRoles('admin', 'manager', 'employee'), updateClient);
router.post('/:id/schedule-call', authorizeRoles('admin', 'manager', 'employee'), scheduleClientCall);
router.post('/:id/notes', authorizeRoles('admin', 'manager', 'employee'), addClientNote);
router.patch('/:id/follow-ups/:followUpId', authorizeRoles('admin', 'manager', 'employee'), completeClientFollowUp);

export default router;
