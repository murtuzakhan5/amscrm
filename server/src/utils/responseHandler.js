export const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, meta = null }) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
};

export const sendError = (res, { statusCode = 500, message = 'An error occurred', errors = null }) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
