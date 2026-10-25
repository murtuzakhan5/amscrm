import { Task, TASK_STATUSES, TASK_PRIORITIES } from '../models/Task.js';
import { Employee } from '../models/Employee.js';
import { generateSequentialId } from '../utils/idGenerator.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { createNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';
import { getRecordFilter } from '../middleware/recordAuth.js';

export const getTasks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      priority = '',
      assignedTo = '',
      sortBy = 'dueDate',
      sortOrder = 'asc',
    } = req.query;

    const baseFilter = await getRecordFilter(req.user, 'assignedTo');
    const filter = { ...baseFilter };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { taskId: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo && (req.user.role === 'admin' || req.user.role === 'manager')) {
      filter.assignedTo = assignedTo;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedTo', 'fullName email employeeId')
        .populate('assignedBy', 'email')
        .populate('relatedLead', 'clientName companyName')
        .populate('relatedProject', 'projectName')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Task.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      data: tasks,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getKanbanTasks = async (req, res, next) => {
  try {
    const baseFilter = await getRecordFilter(req.user, 'assignedTo');
    const filter = { ...baseFilter };

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'fullName email employeeId')
      .populate('relatedProject', 'projectName')
      .sort({ dueDate: 1 });

    const kanbanData = {};
    TASK_STATUSES.forEach((st) => {
      kanbanData[st] = [];
    });

    tasks.forEach((task) => {
      if (kanbanData[task.status]) {
        kanbanData[task.status].push(task);
      }
    });

    return sendSuccess(res, { data: kanbanData });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description = '',
      assignedTo,
      relatedLead = null,
      relatedProject = null,
      priority = 'medium',
      dueDate,
      startDate = new Date(),
    } = req.body;

    if (!title || !dueDate) {
      return sendError(res, { statusCode: 400, message: 'Title and due date are required.' });
    }

    const targetEmployeeId = assignedTo || req.user.employee?._id || req.user.employee;
    if (!targetEmployeeId) {
      return sendError(res, { statusCode: 400, message: 'Assigned employee is required.' });
    }

    const taskId = await generateSequentialId(Task, 'AMS-TSK');

    const task = new Task({
      taskId,
      title,
      description,
      assignedTo: targetEmployeeId,
      assignedBy: req.user._id,
      relatedLead: relatedLead || null,
      relatedProject: relatedProject || null,
      priority,
      status: 'todo',
      startDate,
      dueDate: new Date(dueDate),
    });

    await task.save();

    // In-app notification
    const employee = await Employee.findById(targetEmployeeId).populate('user');
    if (employee && employee.user) {
      await createNotification({
        recipient: employee.user._id,
        title: 'New Task Assigned',
        message: `You have been assigned task: "${title}". Due: ${new Date(dueDate).toLocaleDateString()}`,
        type: 'task_assigned',
        link: '/tasks',
      });
    }

    await logAudit({
      action: 'TASK_CREATED',
      entityType: 'Task',
      entityId: task._id,
      performedBy: req.user._id,
      details: { taskId, title, assignedTo: employee?.fullName },
      req,
    });

    const populated = await Task.findById(task._id).populate('assignedTo', 'fullName email');

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Task created successfully.',
      data: { task: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return sendError(res, { statusCode: 404, message: 'Task not found.' });
    }

    // Role check for employee
    if (req.user.role === 'employee') {
      const myId = req.user.employee?._id || req.user.employee;
      if (task.assignedTo.toString() !== myId?.toString()) {
        return sendError(res, { statusCode: 403, message: 'Access denied to edit this task.' });
      }
    }

    const { title, description, assignedTo, priority, status, dueDate, completionDate } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined && req.user.role !== 'employee') task.assignedTo = assignedTo;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = new Date(dueDate);

    if (status !== undefined) {
      task.status = status;
      if (status === 'completed' && !task.completionDate) {
        task.completionDate = completionDate ? new Date(completionDate) : new Date();
      } else if (status !== 'completed') {
        task.completionDate = null;
      }
    }

    await task.save();

    await logAudit({
      action: 'TASK_UPDATED',
      entityType: 'Task',
      entityId: task._id,
      performedBy: req.user._id,
      details: { updatedFields: req.body },
      req,
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'fullName email')
      .populate('relatedProject', 'projectName');

    return sendSuccess(res, {
      message: 'Task updated successfully.',
      data: { task: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const addTaskComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return sendError(res, { statusCode: 400, message: 'Comment cannot be empty.' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return sendError(res, { statusCode: 404, message: 'Task not found.' });
    }

    task.comments.push({
      text,
      author: req.user._id,
      createdAt: new Date(),
    });

    await task.save();

    const populated = await Task.findById(task._id).populate('comments.author', 'email employee');

    return sendSuccess(res, {
      message: 'Comment added successfully.',
      data: { comments: populated.comments },
    });
  } catch (error) {
    next(error);
  }
};
