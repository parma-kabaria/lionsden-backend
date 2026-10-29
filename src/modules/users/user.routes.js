import { Router } from 'express';
import * as userController from './user.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import {
  requirePermissions,
  requireRoles,
  enforceBranchScope,
} from '../../common/middleware/rbac.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { createUserSchema, updateUserSchema, resetPasswordSchema } from './user.validator.js';
import { idParamSchema } from '../../common/validators/id.validator.js';
import { paginationQuerySchema } from '../../common/validators/pagination.validator.js';
import { ROLES, PERMISSIONS } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermissions([PERMISSIONS.USERS_READ]),
  enforceBranchScope({ source: 'query', field: 'branchId' }),
  validate({ query: paginationQuerySchema }),
  userController.getAllUsers
);

router.get(
  '/:id',
  validate({ params: idParamSchema }),
  requirePermissions([PERMISSIONS.USERS_READ]),
  userController.getUserById
);

router.post(
  '/',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  requirePermissions([PERMISSIONS.USERS_CREATE]),
  validate({ body: createUserSchema }),
  userController.createUser
);

router.put(
  '/:id',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  requirePermissions([PERMISSIONS.USERS_UPDATE]),
  validate({ params: idParamSchema, body: updateUserSchema }),
  userController.updateUser
);

router.post(
  '/:id/reset-password',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  requirePermissions([PERMISSIONS.USERS_UPDATE]),
  validate({ params: idParamSchema, body: resetPasswordSchema }),
  userController.resetUserPassword
);

router.delete(
  '/:id',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  requirePermissions([PERMISSIONS.USERS_DELETE]),
  validate({ params: idParamSchema }),
  userController.deleteUser
);

export default router;
