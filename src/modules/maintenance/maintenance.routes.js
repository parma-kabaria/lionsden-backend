import { Router } from 'express';
import * as maintenanceController from './maintenance.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import {
  requirePermissions,
  requireRoles,
  enforceBranchScope,
} from '../../common/middleware/rbac.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { createMaintenanceSchema, updateMaintenanceStatusSchema } from './maintenance.validator.js';
import { idParamSchema } from '../../common/validators/id.validator.js';
import { paginationQuerySchema } from '../../common/validators/pagination.validator.js';
import { ROLES, PERMISSIONS } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermissions([PERMISSIONS.MAINTENANCE_READ]),
  enforceBranchScope({ source: 'query', field: 'branchId' }),
  validate({ query: paginationQuerySchema }),
  maintenanceController.getAllTickets
);

router.get(
  '/:id',
  validate({ params: idParamSchema }),
  requirePermissions([PERMISSIONS.MAINTENANCE_READ]),
  maintenanceController.getTicketById
);

router.post(
  '/',
  requirePermissions([PERMISSIONS.MAINTENANCE_CREATE]),
  validate({ body: createMaintenanceSchema }),
  maintenanceController.createTicket
);

router.patch(
  '/:id/status',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  requirePermissions([PERMISSIONS.MAINTENANCE_UPDATE]),
  validate({ params: idParamSchema, body: updateMaintenanceStatusSchema }),
  maintenanceController.updateTicketStatus
);

export default router;
