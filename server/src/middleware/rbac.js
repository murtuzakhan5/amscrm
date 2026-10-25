import { sendError } from '../utils/responseHandler.js';

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, {
        statusCode: 401,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, {
        statusCode: 403,
        message: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] permissions.`,
      });
    }

    next();
  };
};
