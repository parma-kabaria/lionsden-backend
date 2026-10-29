import * as customerService from './customer.service.js';
import { sendSuccess, sendCreated } from '../../common/utils/response.util.js';

export const createCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.createCustomer(req.body, req);
    return sendCreated(res, { data: customer, message: 'Customer registered successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAllCustomers = async (req, res, next) => {
  try {
    const { branchId, search, page, limit } = req.query;
    const effectiveBranch = req.effectiveBranchId || branchId;

    const result = await customerService.getAllCustomers({
      branchId: effectiveBranch,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return sendSuccess(res, {
      data: result.customers,
      meta: { pagination: result.pagination },
      message: 'Customers retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    return sendSuccess(res, { data: customer, message: 'Customer retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body, req);
    return sendSuccess(res, { data: customer, message: 'Customer updated successfully' });
  } catch (error) {
    next(error);
  }
};
