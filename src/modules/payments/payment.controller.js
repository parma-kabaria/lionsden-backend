import * as paymentService from './payment.service.js';
import { sendSuccess, sendCreated } from '../../common/utils/response.util.js';

export const recordPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.recordPayment(req.body, req);
    return sendCreated(res, { data: payment, message: 'Payment recorded successfully' });
  } catch (error) {
    next(error);
  }
};

export const recordReversal = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const result = await paymentService.recordReversal(req.params.id, reason, req);
    return sendSuccess(res, { data: result, message: 'Payment reversal processed successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAllPayments = async (req, res, next) => {
  try {
    const {
      branchId,
      bookingId,
      collectingUserId,
      paymentMode,
      type,
      startDate,
      endDate,
      search,
      page,
      limit,
    } = req.query;

    const effectiveBranch = req.effectiveBranchId || branchId;

    const result = await paymentService.getAllPayments({
      branchId: effectiveBranch,
      bookingId,
      collectingUserId,
      paymentMode,
      type,
      startDate,
      endDate,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return sendSuccess(res, {
      data: result.payments,
      meta: { pagination: result.pagination },
      message: 'Payments retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);
    return sendSuccess(res, { data: payment, message: 'Payment retrieved successfully' });
  } catch (error) {
    next(error);
  }
};
