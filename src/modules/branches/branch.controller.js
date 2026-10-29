import * as branchService from './branch.service.js';
import { sendSuccess, sendCreated } from '../../common/utils/response.util.js';

export const createBranch = async (req, res, next) => {
  try {
    const branch = await branchService.createBranch(req.body, req);
    return sendCreated(res, { data: branch, message: 'Branch created successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAllBranches = async (req, res, next) => {
  try {
    const { isActive, search } = req.query;
    const branches = await branchService.getAllBranches({
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
    });
    return sendSuccess(res, { data: branches, message: 'Branches retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

export const getBranchById = async (req, res, next) => {
  try {
    const branch = await branchService.getBranchById(req.params.id);
    return sendSuccess(res, { data: branch, message: 'Branch retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateBranch = async (req, res, next) => {
  try {
    const branch = await branchService.updateBranch(req.params.id, req.body, req);
    return sendSuccess(res, { data: branch, message: 'Branch updated successfully' });
  } catch (error) {
    next(error);
  }
};
