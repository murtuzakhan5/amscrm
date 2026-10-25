import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from './env.js';

export const signAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee ? (user.employee._id || user.employee) : null,
    },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpiry }
  );
};

export const signRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      role: user.role,
    },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiry }
  );
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.jwtAccessSecret);
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.jwtRefreshSecret);
  } catch (error) {
    return null;
  }
};

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const getCookieOptions = (isRefresh = false) => {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    maxAge: isRefresh
      ? 7 * 24 * 60 * 60 * 1000 // 7 days
      : 15 * 60 * 1000, // 15 mins
    path: '/',
  };
};
