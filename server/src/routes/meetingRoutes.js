import { Router } from 'express';
import {
  getMeetings,
  getCalendarEvents,
  getMeetingById,
  createMeeting,
  updateMeeting,
  updateMeetingStatus,
} from '../controllers/meetingController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getMeetings);
router.get('/calendar', getCalendarEvents);
router.get('/:id', getMeetingById);
router.post('/', createMeeting);
router.patch('/:id', updateMeeting);
router.patch('/:id/status', updateMeetingStatus);

export default router;
