import * as pricingService from './pricing.service.js';
import { sendSuccess, sendCreated } from '../../common/utils/response.util.js';

export const createPricingRule = async (req, res, next) => {
  try {
    const rule = await pricingService.createPricingRule(req.body, req);
    return sendCreated(res, { data: rule, message: 'Pricing rule created successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAllPricingRules = async (req, res, next) => {
  try {
    const { branchId, isActive, search, page, limit } = req.query;
    const effectiveBranch = req.effectiveBranchId || branchId;

    const result = await pricingService.getAllPricingRules({
      branchId: effectiveBranch,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return sendSuccess(res, {
      data: result.rules,
      meta: { pagination: result.pagination },
      message: 'Pricing rules retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getPricingRuleById = async (req, res, next) => {
  try {
    const rule = await pricingService.getPricingRuleById(req.params.id);
    return sendSuccess(res, { data: rule, message: 'Pricing rule retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

export const updatePricingRule = async (req, res, next) => {
  try {
    const rule = await pricingService.updatePricingRule(req.params.id, req.body, req);
    return sendSuccess(res, { data: rule, message: 'Pricing rule updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deletePricingRule = async (req, res, next) => {
  try {
    const result = await pricingService.deletePricingRule(req.params.id, req);
    return sendSuccess(res, { data: result, message: 'Pricing rule deleted successfully' });
  } catch (error) {
    next(error);
  }
};

