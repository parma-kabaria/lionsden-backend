import { Router } from 'express';
import * as customerController from './customer.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requirePermissions, enforceBranchScope } from '../../common/middleware/rbac.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { createCustomerSchema, updateCustomerSchema } from './customer.validator.js';
import { idParamSchema } from '../../common/validators/id.validator.js';
import { paginationQuerySchema } from '../../common/validators/pagination.validator.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermissions([PERMISSIONS.CUSTOMERS_READ]),
  enforceBranchScope({ source: 'query', field: 'branchId' }),
  validate({ query: paginationQuerySchema }),
  customerController.getAllCustomers
);

router.get(
  '/:id',
  validate({ params: idParamSchema }),
  requirePermissions([PERMISSIONS.CUSTOMERS_READ]),
  customerController.getCustomerById
);

router.post(
  '/',
  requirePermissions([PERMISSIONS.CUSTOMERS_CREATE]),
  validate({ body: createCustomerSchema }),
  customerController.createCustomer
);

router.put(
  '/:id',
  requirePermissions([PERMISSIONS.CUSTOMERS_UPDATE]),
  validate({ params: idParamSchema, body: updateCustomerSchema }),
  customerController.updateCustomer
);

export default router;
