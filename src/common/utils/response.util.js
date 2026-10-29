/**
 * Standard API Response Utilities
 */

export const sendSuccess = (
  res,
  { data = null, message = 'Success', meta = undefined, statusCode = 200 }
) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta !== undefined) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

export const sendCreated = (res, { data = null, message = 'Resource created successfully' }) => {
  return sendSuccess(res, { data, message, statusCode: 201 });
};

export const sendNoContent = res => {
  return res.status(204).send();
};
