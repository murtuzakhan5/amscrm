import crypto from 'crypto';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { RefreshSession } from '../models/RefreshSession.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  getCookieOptions,
} from '../config/jwt.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { logAudit } from '../services/auditService.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { env } from '../config/env.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, {
        statusCode: 400,
        message: 'Please provide both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .populate('employee');

    if (!user) {
      return sendError(res, {
        statusCode: 401,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, {
        statusCode: 401,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive || user.isDeleted) {
      return sendError(res, {
        statusCode: 403,
        message: 'Your account has been deactivated. Please contact your administrator.',
      });
    }

    // Generate tokens
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    // Save refresh session in DB
    const refreshTokenHash = hashToken(refreshToken);
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshSession.create({
      user: user._id,
      tokenHash: refreshTokenHash,
      expiresAt: sessionExpiresAt,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Set HttpOnly Cookies
    res.cookie('accessToken', accessToken, getCookieOptions(false));
    res.cookie('refreshToken', refreshToken, getCookieOptions(true));

    await logAudit({
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      performedBy: user._id,
      details: { email: user.email, role: user.role },
      req,
    });

    const userObj = user.toObject();
    delete userObj.password;

    return sendSuccess(res, {
      message: 'Login successful.',
      data: {
        user: userObj,
        accessToken, // also sent in body for flexibility if client uses bearer headers
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return sendError(res, {
        statusCode: 401,
        message: 'Refresh token not provided.',
      });
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      return sendError(res, {
        statusCode: 401,
        message: 'Invalid or expired refresh token. Please log in again.',
      });
    }

    const tokenHash = hashToken(token);
    const session = await RefreshSession.findOne({
      tokenHash,
      isRevoked: false,
    });

    if (!session) {
      // Possible token reuse attempt: invalidate all sessions for this user for security
      await RefreshSession.updateMany({ user: decoded.id }, { isRevoked: true });
      res.clearCookie('accessToken', getCookieOptions(false));
      res.clearCookie('refreshToken', getCookieOptions(true));
      return sendError(res, {
        statusCode: 401,
        message: 'Session invalid or revoked. Please log in again.',
      });
    }

    const user = await User.findById(decoded.id).populate('employee');
    if (!user || !user.isActive || user.isDeleted) {
      return sendError(res, {
        statusCode: 403,
        message: 'Account is deactivated or does not exist.',
      });
    }

    // Revoke current session (Refresh Token Rotation)
    session.isRevoked = true;
    await session.save();

    // Create new tokens
    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    // Save new session
    const newHash = hashToken(newRefreshToken);
    await RefreshSession.create({
      user: user._id,
      tokenHash: newHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.cookie('accessToken', newAccessToken, getCookieOptions(false));
    res.cookie('refreshToken', newRefreshToken, getCookieOptions(true));

    return sendSuccess(res, {
      message: 'Token refreshed successfully.',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const tokenHash = hashToken(token);
      await RefreshSession.updateOne({ tokenHash }, { isRevoked: true });
    }

    res.clearCookie('accessToken', getCookieOptions(false));
    res.clearCookie('refreshToken', getCookieOptions(true));

    if (req.user) {
      await logAudit({
        action: 'USER_LOGOUT',
        entityType: 'User',
        entityId: req.user._id,
        performedBy: req.user._id,
        details: { email: req.user.email },
        req,
      });
    }

    return sendSuccess(res, { message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'employee',
        populate: { path: 'manager', select: 'fullName email designation' },
      })
      .select('-password');

    return sendSuccess(res, {
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, { statusCode: 400, message: 'Email address is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always return success even if user not found to prevent email enumeration
    if (!user) {
      return sendSuccess(res, {
        message: 'If an account exists with that email, a password reset link has been dispatched.',
      });
    }

    // Invalidate any existing unused reset tokens for this user
    await PasswordResetToken.deleteMany({ user: user._id });

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordResetToken.create({
      user: user._id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${env.clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    await logAudit({
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      entityId: user._id,
      performedBy: user._id,
      details: { email: user.email },
      req,
    });

    return sendSuccess(res, {
      message: 'If an account exists with that email, a password reset link has been dispatched.',
      data: env.isProduction ? null : { devResetUrl: resetUrl, resetToken },
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return sendError(res, {
        statusCode: 400,
        message: 'Token, email, and new password are required.',
      });
    }

    if (password.length < 8) {
      return sendError(res, {
        statusCode: 400,
        message: 'Password must be at least 8 characters long.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return sendError(res, { statusCode: 400, message: 'Invalid or expired password reset token.' });
    }

    const tokenHash = hashToken(token);
    const resetRecord = await PasswordResetToken.findOne({
      user: user._id,
      tokenHash,
      expiresAt: { $gt: new Date() },
      usedAt: null,
    });

    if (!resetRecord) {
      return sendError(res, {
        statusCode: 400,
        message: 'Invalid or expired password reset token.',
      });
    }

    // Update password
    user.password = password;
    await user.save();

    // Mark token used
    resetRecord.usedAt = new Date();
    await resetRecord.save();

    // Revoke all active sessions
    await RefreshSession.updateMany({ user: user._id }, { isRevoked: true });

    await logAudit({
      action: 'PASSWORD_RESET_SUCCESSFUL',
      entityType: 'User',
      entityId: user._id,
      performedBy: user._id,
      details: { email: user.email },
      req,
    });

    return sendSuccess(res, {
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, {
        statusCode: 400,
        message: 'Please provide both current and new passwords.',
      });
    }

    if (newPassword.length < 8) {
      return sendError(res, {
        statusCode: 400,
        message: 'New password must be at least 8 characters long.',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return sendError(res, {
        statusCode: 400,
        message: 'Current password is incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    // Invalidate refresh sessions except possibly current
    await RefreshSession.updateMany({ user: user._id }, { isRevoked: true });

    await logAudit({
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user._id,
      performedBy: user._id,
      req,
    });

    return sendSuccess(res, {
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { phoneNumber, address, emergencyContact, profilePicture } = req.body;

    if (!req.user.employee) {
      return sendError(res, { statusCode: 400, message: 'Employee profile not associated.' });
    }

    const employee = await Employee.findById(req.user.employee._id || req.user.employee);
    if (!employee) {
      return sendError(res, { statusCode: 404, message: 'Employee profile not found.' });
    }

    if (phoneNumber !== undefined) employee.phoneNumber = phoneNumber;
    if (address !== undefined) employee.address = { ...employee.address, ...address };
    if (emergencyContact !== undefined) employee.emergencyContact = { ...employee.emergencyContact, ...emergencyContact };
    if (profilePicture !== undefined) employee.profilePicture = profilePicture;

    await employee.save();

    await logAudit({
      action: 'PROFILE_UPDATED',
      entityType: 'Employee',
      entityId: employee._id,
      performedBy: req.user._id,
      req,
    });

    return sendSuccess(res, {
      message: 'Profile updated successfully.',
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
};
