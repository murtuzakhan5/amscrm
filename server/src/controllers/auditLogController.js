import { AuditLog } from '../models/AuditLog.js';
import { sendSuccess } from '../utils/responseHandler.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action = '', entityType = '' } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('performedBy', 'email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      data: logs,
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
