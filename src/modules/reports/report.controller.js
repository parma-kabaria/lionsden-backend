import * as reportService from './report.service.js';
import { sendSuccess } from '../../common/utils/response.util.js';

export const getCollectionsReport = async (req, res, next) => {
  try {
    const { branchId, startDate, endDate } = req.query;
    const effectiveBranch = req.effectiveBranchId || branchId;

    const data = await reportService.getCollectionsReport({
      branchId: effectiveBranch,
      startDate,
      endDate,
    });

    return sendSuccess(res, { data, message: 'Collections report generated successfully' });
  } catch (error) {
    next(error);
  }
};

export const getOccupancyReport = async (req, res, next) => {
  try {
    const { branchId, startDate, endDate } = req.query;
    const effectiveBranch = req.effectiveBranchId || branchId;

    const data = await reportService.getOccupancyReport({
      branchId: effectiveBranch,
      startDate,
      endDate,
    });

    return sendSuccess(res, { data, message: 'Occupancy report generated successfully' });
  } catch (error) {
    next(error);
  }
};

export const getBalancesReport = async (req, res, next) => {
  try {
    const { branchId, status, page, limit } = req.query;
    const effectiveBranch = req.effectiveBranchId || branchId;

    const result = await reportService.getBalancesReport({
      branchId: effectiveBranch,
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });

    return sendSuccess(res, {
      data: result.bookings,
      meta: { pagination: result.pagination },
      message: 'Booking balances report generated successfully',
    });
  } catch (error) {
    next(error);
  }
};
