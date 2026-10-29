import { Router } from 'express';
import * as bungalowController from './bungalow.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import {
  requirePermissions,
  requireRoles,
  enforceBranchScope,
} from '../../common/middleware/rbac.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { createBungalowSchema, updateBungalowSchema } from './bungalow.validator.js';
import { idParamSchema } from '../../common/validators/id.validator.js';
import { ROLES, PERMISSIONS } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermissions([PERMISSIONS.BUNGALOWS_READ]),
  enforceBranchScope({ source: 'query', field: 'branchId' }),
  bungalowController.getAllBungalows
);

router.get(
  '/:id',
  validate({ params: idParamSchema }),
  requirePermissions([PERMISSIONS.BUNGALOWS_READ]),
  bungalowController.getBungalowById
);

router.post(
  '/',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  requirePermissions([PERMISSIONS.BUNGALOWS_CREATE]),
  validate({ body: createBungalowSchema }),
  bungalowController.createBungalow
);

router.put(
  '/:id',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  requirePermissions([PERMISSIONS.BUNGALOWS_UPDATE]),
  validate({ params: idParamSchema, body: updateBungalowSchema }),
  bungalowController.updateBungalow
);

router.delete(
  '/:id',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  requirePermissions([PERMISSIONS.BUNGALOWS_DELETE]),
  validate({ params: idParamSchema }),
  bungalowController.deleteBungalow
);

export default router;
