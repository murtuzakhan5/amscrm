import { verifyAccessToken } from '../config/jwt.js';
import { User } from '../models/User.js';
import { sendError } from '../utils/responseHandler.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check HttpOnly cookie
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // 2. Check Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, {
        statusCode: 401,
        message: 'Authentication required. Please log in.',
      });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return sendError(res, {
        statusCode: 401,
        message: 'Invalid or expired access token. Please refresh session.',
      });
    }

    const user = await User.findById(decoded.id)
      .populate('employee')
      .select('-password');

    if (!user) {
      return sendError(res, {
        statusCode: 401,
        message: 'User account not found.',
      });
    }

    if (!user.isActive || user.isDeleted) {
      return sendError(res, {
        statusCode: 403,
        message: 'Your account has been deactivated or removed. Contact administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return sendError(res, {
      statusCode: 500,
      message: 'Authentication check failed',
    });
  }
};
