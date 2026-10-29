import * as roleService from './role.service.js';
import { sendSuccess, sendCreated } from '../../common/utils/response.util.js';

export const getAvailablePermissions = async (req, res, next) => {
  try {
    const data = await roleService.getAvailablePermissions();
    return sendSuccess(res, { data, message: 'Permissions retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAllRoles = async (req, res, next) => {
  try {
    const roles = await roleService.getAllRoles();
    return sendSuccess(res, { data: roles, message: 'Roles retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

export const getRoleById = async (req, res, next) => {
  try {
    const role = await roleService.getRoleById(req.params.id);
    return sendSuccess(res, { data: role, message: 'Role retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req, res, next) => {
  try {
    const role = await roleService.createRole(req.body, req);
    return sendCreated(res, { data: role, message: 'Role created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const role = await roleService.updateRole(req.params.id, req.body, req);
    return sendSuccess(res, { data: role, message: 'Role updated successfully' });
  } catch (error) {
    next(error);
  }
};
