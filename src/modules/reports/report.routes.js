import { Router } from 'express';
import * as reportController from './report.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requirePermissions, enforceBranchScope } from '../../common/middleware/rbac.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { reportQuerySchema } from './report.validator.js';
import { paginationQuerySchema } from '../../common/validators/pagination.validator.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get(
  '/collections',
  requirePermissions([PERMISSIONS.REPORTS_READ]),
  enforceBranchScope({ source: 'query', field: 'branchId' }),
  validate({ query: reportQuerySchema }),
  reportController.getCollectionsReport
);

router.get(
  '/occupancy',
  requirePermissions([PERMISSIONS.REPORTS_READ]),
  enforceBranchScope({ source: 'query', field: 'branchId' }),
  validate({ query: reportQuerySchema }),
  reportController.getOccupancyReport
);

router.get(
  '/balances',
  requirePermissions([PERMISSIONS.REPORTS_READ]),
  enforceBranchScope({ source: 'query', field: 'branchId' }),
  validate({ query: paginationQuerySchema }),
  reportController.getBalancesReport
);

export default router;
