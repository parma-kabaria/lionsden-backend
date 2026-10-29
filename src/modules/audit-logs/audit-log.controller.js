import * as auditLogService from './audit-log.service.js';
import { sendSuccess } from '../../common/utils/response.util.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const { branchId, entity, action, startDate, endDate, page, limit } = req.query;
    const effectiveBranch = req.effectiveBranchId || branchId;

    const result = await auditLogService.getAuditLogs({
      branchId: effectiveBranch,
      entity,
      action,
      startDate,
      endDate,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return sendSuccess(res, {
      data: result.logs,
      meta: { pagination: result.pagination },
      message: 'Audit logs retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};
