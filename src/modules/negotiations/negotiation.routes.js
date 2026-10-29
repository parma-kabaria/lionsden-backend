import { Router } from 'express';
import * as negotiationController from './negotiation.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import {
  requirePermissions,
  requireRoles,
  enforceBranchScope,
} from '../../common/middleware/rbac.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { submitNegotiationSchema, decisionNegotiationSchema } from './negotiation.validator.js';
import { idParamSchema } from '../../common/validators/id.validator.js';
import { paginationQuerySchema } from '../../common/validators/pagination.validator.js';
import { ROLES, PERMISSIONS } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermissions([PERMISSIONS.NEGOTIATIONS_READ]),
  enforceBranchScope({ source: 'query', field: 'branchId' }),
  validate({ query: paginationQuerySchema }),
  negotiationController.getAllNegotiations
);

router.post(
  '/',
  requirePermissions([PERMISSIONS.NEGOTIATIONS_SUBMIT]),
  validate({ body: submitNegotiationSchema }),
  negotiationController.submitRequest
);

router.post(
  '/:id/approve',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  requirePermissions([PERMISSIONS.NEGOTIATIONS_APPROVE]),
  validate({ params: idParamSchema, body: decisionNegotiationSchema }),
  negotiationController.approveRequest
);

router.post(
  '/:id/reject',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  requirePermissions([PERMISSIONS.NEGOTIATIONS_APPROVE]),
  validate({ params: idParamSchema, body: decisionNegotiationSchema }),
  negotiationController.rejectRequest
);

export default router;
