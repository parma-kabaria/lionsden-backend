import { User } from './user.model.js';
import { Role } from '../roles/role.model.js';
import { Branch } from '../branches/branch.model.js';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  ForbiddenError,
} from '../../common/errors/app.error.js';
import { ROLES } from '../../config/constants.js';
import { logAudit } from '../audit-logs/audit-log.service.js';

export const createUser = async (data, req) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    throw new ConflictError('A user with this email already exists');
  }

  const role = await Role.findById(data.role);
  if (!role) {
    throw new NotFoundError('Specified role not found');
  }

  // Branch validation: Super Admin can have null branch; others must have a valid branch
  if (role.code !== ROLES.SUPER_ADMIN && !data.branch) {
    throw new BadRequestError(`Users with role ${role.name} must be assigned to a branch`);
  }

  if (data.branch) {
    const branch = await Branch.findById(data.branch);
    if (!branch) {
      throw new NotFoundError('Specified branch not found');
    }
  }

  // Enforce caller hierarchy: Non-SuperAdmin cannot create SuperAdmin
  const callerRoleCode = req?.user?.role?.code || req?.user?.role;
  if (callerRoleCode !== ROLES.SUPER_ADMIN && role.code === ROLES.SUPER_ADMIN) {
    throw new ForbiddenError('Only Super Admin can create another Super Admin user');
  }

  const user = await User.create(data);
  const populatedUser = await User.findById(user._id)
    .populate('role', 'name code permissions')
    .populate('branch', 'name code');

  await logAudit({
    req,
    action: 'USER_CREATED',
    entity: 'USER',
    entityId: user._id,
    branch: user.branch,
    changes: { name: user.name, email: user.email, role: role.code, branch: user.branch },
  });

  return populatedUser;
};

export const getAllUsers = async ({ branchId, roleId, isActive, search, page = 1, limit = 20 }) => {
  const filter = {};

  if (branchId) filter.branch = branchId;
  if (roleId) filter.role = roleId;
  if (isActive !== undefined) filter.isActive = isActive;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .populate('role', 'name code')
      .populate('branch', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserById = async id => {
  const user = await User.findById(id)
    .populate('role', 'name code permissions')
    .populate('branch', 'name code');

  if (!user) {
    throw new NotFoundError(`User with id ${id} not found`);
  }
  return user;
};

export const updateUser = async (id, data, req) => {
  const user = await User.findById(id).populate('role');
  if (!user) {
    throw new NotFoundError(`User with id ${id} not found`);
  }

  // Prevent modifying Super Admin unless caller is Super Admin
  const callerRoleCode = req?.user?.role?.code || req?.user?.role;
  if (user.role.code === ROLES.SUPER_ADMIN && callerRoleCode !== ROLES.SUPER_ADMIN) {
    throw new ForbiddenError('Only Super Admin can update a Super Admin profile');
  }

  if (data.role) {
    const newRole = await Role.findById(data.role);
    if (!newRole) throw new NotFoundError('Specified role not found');
    if (newRole.code === ROLES.SUPER_ADMIN && callerRoleCode !== ROLES.SUPER_ADMIN) {
      throw new ForbiddenError('Only Super Admin can assign Super Admin role');
    }
  }

  if (data.branch) {
    const branch = await Branch.findById(data.branch);
    if (!branch) throw new NotFoundError('Specified branch not found');
  }

  const previousData = {
    name: user.name,
    phone: user.phone,
    role: user.role,
    branch: user.branch,
    isActive: user.isActive,
  };

  Object.assign(user, data);
  await user.save();

  const updatedUser = await User.findById(id)
    .populate('role', 'name code permissions')
    .populate('branch', 'name code');

  await logAudit({
    req,
    action: 'USER_UPDATED',
    entity: 'USER',
    entityId: id,
    branch: user.branch,
    changes: { before: previousData, after: data },
  });

  return updatedUser;
};

export const resetUserPassword = async (id, newPassword, req) => {
  const user = await User.findById(id).populate('role');
  if (!user) {
    throw new NotFoundError(`User with id ${id} not found`);
  }

  const callerRoleCode = req?.user?.role?.code || req?.user?.role;
  if (user.role.code === ROLES.SUPER_ADMIN && callerRoleCode !== ROLES.SUPER_ADMIN) {
    throw new ForbiddenError('Only Super Admin can reset a Super Admin password');
  }

  user.password = newPassword;
  await user.save();

  await logAudit({
    req,
    action: 'USER_PASSWORD_RESET',
    entity: 'USER',
    entityId: id,
    branch: user.branch,
    changes: { resetBy: req.user._id },
  });

  return { message: 'Password has been reset successfully' };
};

export const deleteUser = async (id, req) => {
  const user = await User.findById(id).populate('role');
  if (!user) {
    throw new NotFoundError(`User with id ${id} not found`);
  }

  // Prevent deleting Super Admin
  if (user.role?.code === ROLES.SUPER_ADMIN) {
    throw new ForbiddenError('Super Admin user cannot be deleted');
  }

  // Prevent user deleting their own account
  if (req?.user?._id?.toString() === id.toString()) {
    throw new BadRequestError('You cannot delete your own account');
  }

  await User.findByIdAndDelete(id);

  await logAudit({
    req,
    action: 'USER_DELETED',
    entity: 'USER',
    entityId: id,
    branch: user.branch,
    changes: { email: user.email, name: user.name },
  });

  return { message: 'User deleted successfully' };
};
