import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async ({
  action,
  entityType,
  entityId,
  performedBy = null,
  details = {},
  req = null,
}) => {
  try {
    const ipAddress = req
      ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
      : '';
    const userAgent = req ? (req.headers['user-agent'] || '') : '';

    await AuditLog.create({
      action,
      entityType,
      entityId: String(entityId),
      performedBy: performedBy || (req?.user?.id || req?.user?._id) || null,
      details,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
