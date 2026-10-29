import * as bungalowService from './bungalow.service.js';
import { sendSuccess, sendCreated } from '../../common/utils/response.util.js';

export const createBungalow = async (req, res, next) => {
  try {
    const bungalow = await bungalowService.createBungalow(req.body, req);
    return sendCreated(res, { data: bungalow, message: 'Bungalow created successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAllBungalows = async (req, res, next) => {
  try {
    const { branchId, category, facility, isActive, maintenanceStatus, search, page, limit } =
      req.query;

    const effectiveBranch = req.effectiveBranchId || branchId;

    const result = await bungalowService.getAllBungalows({
      branchId: effectiveBranch,
      category,
      facility,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      maintenanceStatus,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });

    return sendSuccess(res, {
      data: result.bungalows,
      meta: { pagination: result.pagination },
      message: 'Bungalows retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getBungalowById = async (req, res, next) => {
  try {
    const bungalow = await bungalowService.getBungalowById(req.params.id);
    return sendSuccess(res, { data: bungalow, message: 'Bungalow retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateBungalow = async (req, res, next) => {
  try {
    const bungalow = await bungalowService.updateBungalow(req.params.id, req.body, req);
    return sendSuccess(res, { data: bungalow, message: 'Bungalow updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteBungalow = async (req, res, next) => {
  try {
    const result = await bungalowService.deleteBungalow(req.params.id, req);
    return sendSuccess(res, { data: result, message: 'Bungalow deleted successfully' });
  } catch (error) {
    next(error);
  }
};
