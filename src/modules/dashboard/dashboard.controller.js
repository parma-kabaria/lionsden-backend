import * as dashboardService from './dashboard.service.js';
import { sendSuccess } from '../../common/utils/response.util.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const effectiveBranch = req.effectiveBranchId || branchId;

    const data = await dashboardService.getDashboardSummary({
      branchId: effectiveBranch,
    });

    return sendSuccess(res, {
      data,
      message: 'Dashboard summary retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};
