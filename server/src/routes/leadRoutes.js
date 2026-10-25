import { Router } from 'express';
import {
  getLeads,
  getKanbanLeads,
  getLeadById,
  createLead,
  updateLead,
  assignLead,
  bulkAssignLeads,
  updateLeadStatus,
  addLeadNote,
  logLeadCall,
  addLeadFollowUp,
  convertLeadToClient,
  exportLeadsToCsv,
} from '../controllers/leadController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getLeads);
router.get('/kanban', getKanbanLeads);
router.get('/export/csv', exportLeadsToCsv);
router.get('/:id', getLeadById);

// Admin & Manager create/assign
router.post('/', authorizeRoles('admin', 'manager'), createLead);
router.patch('/:id/assign', authorizeRoles('admin', 'manager'), assignLead);
router.post('/bulk-assign', authorizeRoles('admin', 'manager'), bulkAssignLeads);
router.post('/:id/convert', authorizeRoles('admin', 'manager'), convertLeadToClient);

// Update lead details & workflow
router.patch('/:id', updateLead);
router.patch('/:id/status', updateLeadStatus);
router.post('/:id/notes', addLeadNote);
router.post('/:id/calls', logLeadCall);
router.post('/:id/follow-ups', addLeadFollowUp);

export default router;
