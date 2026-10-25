import { Router } from 'express';
import {
  getTasks,
  getKanbanTasks,
  createTask,
  updateTask,
  addTaskComment,
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getTasks);
router.get('/kanban', getKanbanTasks);
router.post('/', createTask);
router.patch('/:id', updateTask);
router.post('/:id/comments', addTaskComment);

export default router;
