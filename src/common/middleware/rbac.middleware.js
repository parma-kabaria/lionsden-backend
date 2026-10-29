import { ForbiddenError } from '../errors/app.error.js';
import { ROLES } from '../../config/constants.js';

/**
 * Checks if authenticated user has required role(s)
 * @param  {...string} allowedRoles
 */
export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new ForbiddenError('User role not assigned'));
    }

    const userRoleCode = req.user.role.code || req.user.role;
    if (userRoleCode === ROLES.SUPER_ADMIN || allowedRoles.includes(userRoleCode)) {
      return next();
    }

    return next(
      new ForbiddenError(`Access denied. Requires one of roles: ${allowedRoles.join(', ')}`)
    );
  };
};

/**
 * Checks if authenticated user has required permission(s)
 * Super Admin always passes.
 * @param {string[]} permissions
 * @param {{ matchAll?: boolean }} options
 */
export const requirePermissions = (permissions = [], { matchAll = true } = {}) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new ForbiddenError('User role not assigned'));
    }

    const userRoleCode = req.user.role.code || req.user.role;
    // Super Admin has all permissions implicitly
    if (userRoleCode === ROLES.SUPER_ADMIN) {
      return next();
    }

    const userPermissions = new Set(req.user.role.permissions || []);

    const hasSinglePermission = (p) => {
      if (userPermissions.has(p)) return true;
      if (userPermissions.has('*') || userPermissions.has('*:*')) return true;
      const [module] = p.split(':');
      if (module && userPermissions.has(`${module}:manage`)) return true;
      return false;
    };

    const hasPermission = matchAll
      ? permissions.every(p => hasSinglePermission(p))
      : permissions.some(p => hasSinglePermission(p));

    if (!hasPermission) {
      return next(
        new ForbiddenError(`Insufficient permissions. Required: [${permissions.join(', ')}]`)
      );
    }

    next();
  };
};

/**
 * Enforces branch scoping.
 * Super Admin can access any branch.
 * Admin and Sales can only access their assigned branch.
 * Automatically attaches req.effectiveBranchId for downstream query filtering.
 * @param {{ source?: 'params' | 'body' | 'query', field?: string }} options
 */
export const enforceBranchScope = ({ source = 'params', field = 'branchId' } = {}) => {
  return (req, res, next) => {
    const userRoleCode = req.user.role?.code || req.user.role;

    // Super Admin has multi-branch access
    if (userRoleCode === ROLES.SUPER_ADMIN) {
      let targetBranch = null;
      if (source === 'params' && req.params[field]) targetBranch = req.params[field];
      if (source === 'body' && req.body[field]) targetBranch = req.body[field];
      if (source === 'query' && req.query[field]) targetBranch = req.query[field];

      req.effectiveBranchId = targetBranch || null;
      return next();
    }

    // Admin & Sales must have an assigned branch
    const userBranchId = req.user.branch?._id?.toString() || req.user.branch?.toString();
    if (!userBranchId) {
      return next(new ForbiddenError('User does not have an assigned branch'));
    }

    let targetBranchId = null;
    if (source === 'params' && req.params[field]) targetBranchId = req.params[field];
    if (source === 'body' && req.body[field]) targetBranchId = req.body[field];
    if (source === 'query' && req.query[field]) targetBranchId = req.query[field];

    if (targetBranchId && targetBranchId.toString() !== userBranchId) {
      return next(
        new ForbiddenError(
          'You do not have permission to access resources outside your assigned branch'
        )
      );
    }

    // Force effective branch to user branch
    req.effectiveBranchId = userBranchId;
    next();
  };
};
