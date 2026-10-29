import * as negotiationService from './negotiation.service.js';
import { sendSuccess, sendCreated } from '../../common/utils/response.util.js';

export const submitRequest = async (req, res, next) => {
  try {
    const result = await negotiationService.submitRequest(req.body, req);
    return sendCreated(res, {
      data: result,
      message: 'Negotiated rent request submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const approveRequest = async (req, res, next) => {
  try {
    const result = await negotiationService.approveRequest(
      req.params.id,
      req.body?.comment || '',
      req
    );
    return sendSuccess(res, {
      data: result,
      message: 'Negotiation request approved and booking rent updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const rejectRequest = async (req, res, next) => {
  try {
    const result = await negotiationService.rejectRequest(
      req.params.id,
      req.body?.comment || '',
      req
    );
    return sendSuccess(res, {
      data: result,
      message: 'Negotiation request rejected successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getAllNegotiations = async (req, res, next) => {
  try {
    const { branchId, status, page, limit } = req.query;
    const effectiveBranch = req.effectiveBranchId || branchId;

    const result = await negotiationService.getAllNegotiations({
      branchId: effectiveBranch,
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return sendSuccess(res, {
      data: result.negotiations,
      meta: { pagination: result.pagination },
      message: 'Negotiation requests retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};
