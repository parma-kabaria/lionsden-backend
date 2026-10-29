import { Router } from 'express';
import * as dashboardController from './dashboard.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requirePermissions, enforceBranchScope } from '../../common/middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermissions([PERMISSIONS.DASHBOARD_READ]),
  enforceBranchScope({ source: 'query', field: 'branchId' }),
  dashboardController.getDashboardSummary
);

export default router;
