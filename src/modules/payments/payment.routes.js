import { Router } from 'express';
import * as paymentController from './payment.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import {
  requirePermissions,
  requireRoles,
  enforceBranchScope,
} from '../../common/middleware/rbac.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { recordPaymentSchema, reversePaymentSchema } from './payment.validator.js';
import { idParamSchema } from '../../common/validators/id.validator.js';
import { paginationQuerySchema } from '../../common/validators/pagination.validator.js';
import { ROLES, PERMISSIONS } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermissions([PERMISSIONS.PAYMENTS_READ]),
  enforceBranchScope({ source: 'query', field: 'branchId' }),
  validate({ query: paginationQuerySchema }),
  paymentController.getAllPayments
);

router.get(
  '/:id',
  validate({ params: idParamSchema }),
  requirePermissions([PERMISSIONS.PAYMENTS_READ]),
  paymentController.getPaymentById
);

router.post(
  '/',
  requirePermissions([PERMISSIONS.PAYMENTS_RECORD]),
  validate({ body: recordPaymentSchema }),
  paymentController.recordPayment
);

router.post(
  '/:id/reverse',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  requirePermissions([PERMISSIONS.PAYMENTS_REVERSE]),
  validate({ params: idParamSchema, body: reversePaymentSchema }),
  paymentController.recordReversal
);

export default router;
