import { Project, PROJECT_STATUSES } from '../models/Project.js';
import { ProjectMilestone } from '../models/ProjectMilestone.js';
import { Task } from '../models/Task.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { logAudit } from '../services/auditService.js';

export const getProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', clientId = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (clientId) filter.client = clientId;
    if (search) {
      filter.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (req.user.role === 'employee') {
      const myId = req.user.employee?._id || req.user.employee;
      filter.$or = [{ assignedTeam: myId }, { projectManager: myId }];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('client', 'name companyName email')
        .populate('projectManager', 'fullName email')
        .populate('assignedTeam', 'fullName email designation')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Project.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      data: projects,
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

export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate('client', 'name companyName email phoneNumber address')
      .populate('projectManager', 'fullName email employeeId phoneNumber')
      .populate('assignedTeam', 'fullName email employeeId designation department');

    if (!project) {
      return sendError(res, { statusCode: 404, message: 'Project not found.' });
    }

    const [milestones, tasks] = await Promise.all([
      ProjectMilestone.find({ project: project._id }).sort({ dueDate: 1 }),
      Task.find({ relatedProject: project._id }).populate('assignedTo', 'fullName email'),
    ]);

    return sendSuccess(res, {
      data: { project, milestones, tasks },
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const {
      projectName,
      client,
      description = '',
      assignedTeam = [],
      projectManager,
      startDate = new Date(),
      deadline,
      budget = 0,
      currency = 'USD',
      deliverables = [],
      notes = '',
    } = req.body;

    if (!projectName || !client || !projectManager || !deadline) {
      return sendError(res, {
        statusCode: 400,
        message: 'Project name, client, project manager, and deadline are required.',
      });
    }

    const project = await Project.create({
      projectName,
      client,
      description,
      assignedTeam,
      projectManager,
      startDate,
      deadline: new Date(deadline),
      budget,
      currency,
      deliverables,
      notes,
      createdBy: req.user._id,
    });

    await logAudit({
      action: 'PROJECT_CREATED',
      entityType: 'Project',
      entityId: project._id,
      performedBy: req.user._id,
      details: { projectName, client, budget },
      req,
    });

    const populated = await Project.findById(project._id)
      .populate('client', 'name companyName')
      .populate('projectManager', 'fullName');

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Project created successfully.',
      data: { project: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      return sendError(res, { statusCode: 404, message: 'Project not found.' });
    }

    const {
      projectName,
      description,
      assignedTeam,
      projectManager,
      deadline,
      budget,
      currency,
      status,
      progressPercentage,
      deliverables,
      notes,
    } = req.body;

    if (projectName !== undefined) project.projectName = projectName;
    if (description !== undefined) project.description = description;
    if (assignedTeam !== undefined) project.assignedTeam = assignedTeam;
    if (projectManager !== undefined) project.projectManager = projectManager;
    if (deadline !== undefined) project.deadline = new Date(deadline);
    if (budget !== undefined) project.budget = budget;
    if (currency !== undefined) project.currency = currency;
    if (status !== undefined) project.status = status;
    if (progressPercentage !== undefined) project.progressPercentage = progressPercentage;
    if (deliverables !== undefined) project.deliverables = deliverables;
    if (notes !== undefined) project.notes = notes;

    await project.save();

    await logAudit({
      action: 'PROJECT_UPDATED',
      entityType: 'Project',
      entityId: project._id,
      performedBy: req.user._id,
      details: { updatedFields: req.body },
      req,
    });

    const populated = await Project.findById(project._id)
      .populate('client', 'name companyName')
      .populate('projectManager', 'fullName')
      .populate('assignedTeam', 'fullName');

    return sendSuccess(res, {
      message: 'Project updated successfully.',
      data: { project: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const addMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description = '', dueDate, deliverables = [] } = req.body;

    if (!title || !dueDate) {
      return sendError(res, { statusCode: 400, message: 'Milestone title and due date are required.' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return sendError(res, { statusCode: 404, message: 'Project not found.' });
    }

    const milestone = await ProjectMilestone.create({
      project: project._id,
      title,
      description,
      dueDate: new Date(dueDate),
      deliverables,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Milestone added successfully.',
      data: { milestone },
    });
  } catch (error) {
    next(error);
  }
};
