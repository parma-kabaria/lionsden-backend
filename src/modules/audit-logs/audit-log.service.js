import { AuditLog } from './audit-log.model.js';
import { logger } from '../../config/logger.js';

const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'refreshToken',
  'secret',
  'accessSecret',
  'refreshSecret',
  'jwt',
]);

const sanitizeData = data => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeData);

  const clean = {};
  for (const [key, val] of Object.entries(data)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (val && typeof val === 'object' && !(val instanceof Date)) {
      clean[key] = sanitizeData(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
};

export const logAudit = async ({
  req,
  actor,
  action,
  entity,
  entityId = null,
  branch = null,
  changes = null,
}) => {
  try {
    const actorInfo = actor || {
      userId: req?.user?._id || req?.user?.id || null,
      name: req?.user?.name || 'System',
      role: req?.user?.role?.code || req?.user?.role || 'SYSTEM',
    };

    const branchId = branch || req?.user?.branch?._id || req?.user?.branch || null;

    await AuditLog.create({
      actor: actorInfo,
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      branch: branchId,
      changes: sanitizeData(changes),
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || '',
      userAgent: req?.headers?.['user-agent'] || '',
    });
  } catch (error) {
    logger.error({ error, action, entity }, 'Failed to record audit log');
  }
};

export const getAuditLogs = async ({
  branchId,
  entity,
  action,
  startDate,
  endDate,
  page = 1,
  limit = 20,
}) => {
  const filter = {};

  if (branchId) filter.branch = branchId;
  if (entity) filter.entity = entity;
  if (action) filter.action = action;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('branch', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
