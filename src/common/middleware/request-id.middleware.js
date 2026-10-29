import crypto from 'node:crypto';

export const requestIdMiddleware = (req, res, next) => {
  const incomingId = req.headers['x-request-id'];
  const requestId = incomingId || crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};
