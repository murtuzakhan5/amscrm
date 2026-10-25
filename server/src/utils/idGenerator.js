import crypto from 'crypto';

export const generateCustomId = (prefix = 'AMS') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const generateSequentialId = async (model, prefix, fieldName = 'employeeId') => {
  const count = await model.countDocuments();
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `${prefix}-${nextNum}`;
};
