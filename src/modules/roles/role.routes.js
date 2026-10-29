import { Router } from 'express';
import * as roleController from './role.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requireRoles, requirePermissions } from '../../common/middleware/rbac.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { createRoleSchema, updateRoleSchema } from './role.validator.js';
import { idParamSchema } from '../../common/validators/id.validator.js';
import { ROLES, PERMISSIONS } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get(
  '/permissions',
  requirePermissions([PERMISSIONS.ROLES_MANAGE, PERMISSIONS.USERS_READ, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_UPDATE], { matchAll: false }),
  roleController.getAvailablePermissions
);

router.get(
  '/',
  requirePermissions([PERMISSIONS.ROLES_MANAGE, PERMISSIONS.USERS_READ, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_UPDATE], { matchAll: false }),
  roleController.getAllRoles
);

router.get(
  '/:id',
  validate({ params: idParamSchema }),
  requirePermissions([PERMISSIONS.ROLES_MANAGE]),
  roleController.getRoleById
);

router.post(
  '/',
  requireRoles(ROLES.SUPER_ADMIN),
  requirePermissions([PERMISSIONS.ROLES_MANAGE]),
  validate({ body: createRoleSchema }),
  roleController.createRole
);

router.put(
  '/:id',
  requireRoles(ROLES.SUPER_ADMIN),
  requirePermissions([PERMISSIONS.ROLES_MANAGE]),
  validate({ params: idParamSchema, body: updateRoleSchema }),
  roleController.updateRole
);

export default router;
