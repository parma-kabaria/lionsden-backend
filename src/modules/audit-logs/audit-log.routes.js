import { Router } from 'express';
import * as auditLogController from './audit-log.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requirePermissions, enforceBranchScope } from '../../common/middleware/rbac.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { paginationQuerySchema } from '../../common/validators/pagination.validator.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermissions([PERMISSIONS.AUDIT_LOGS_READ]),
  enforceBranchScope({ source: 'query', field: 'branchId' }),
  validate({ query: paginationQuerySchema }),
  auditLogController.getAuditLogs
);

export default router;
