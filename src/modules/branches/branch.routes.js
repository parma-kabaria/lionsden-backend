import { Router } from 'express';
import * as branchController from './branch.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requireRoles, requirePermissions } from '../../common/middleware/rbac.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { createBranchSchema, updateBranchSchema } from './branch.validator.js';
import { idParamSchema } from '../../common/validators/id.validator.js';
import { ROLES, PERMISSIONS } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermissions([PERMISSIONS.BRANCHES_READ]), branchController.getAllBranches);

router.get(
  '/:id',
  validate({ params: idParamSchema }),
  requirePermissions([PERMISSIONS.BRANCHES_READ]),
  branchController.getBranchById
);

router.post(
  '/',
  requireRoles(ROLES.SUPER_ADMIN),
  requirePermissions([PERMISSIONS.BRANCHES_CREATE]),
  validate({ body: createBranchSchema }),
  branchController.createBranch
);

router.put(
  '/:id',
  requireRoles(ROLES.SUPER_ADMIN),
  requirePermissions([PERMISSIONS.BRANCHES_UPDATE]),
  validate({ params: idParamSchema, body: updateBranchSchema }),
  branchController.updateBranch
);

export default router;
