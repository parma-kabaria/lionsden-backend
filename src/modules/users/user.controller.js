import * as userService from './user.service.js';
import { sendSuccess, sendCreated } from '../../common/utils/response.util.js';

export const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body, req);
    return sendCreated(res, { data: user, message: 'User created successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { branchId, roleId, isActive, search, page, limit } = req.query;
    // Scoping: If user is non-super admin and branchId not set, restrict to user branch
    const effectiveBranch = req.effectiveBranchId || branchId;

    const result = await userService.getAllUsers({
      branchId: effectiveBranch,
      roleId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return sendSuccess(res, {
      data: result.users,
      meta: { pagination: result.pagination },
      message: 'Users retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return sendSuccess(res, { data: user, message: 'User retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req);
    return sendSuccess(res, { data: user, message: 'User updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const resetUserPassword = async (req, res, next) => {
  try {
    const result = await userService.resetUserPassword(req.params.id, req.body.newPassword, req);
    return sendSuccess(res, { data: result, message: result.message });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const result = await userService.deleteUser(req.params.id, req);
    return sendSuccess(res, { data: result, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
