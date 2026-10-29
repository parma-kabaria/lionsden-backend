import { PricingRule } from './pricing.model.js';
import { PRICING_ADJUSTMENT_TYPES } from '../../config/constants.js';
import { NotFoundError } from '../../common/errors/app.error.js';
import { logAudit } from '../audit-logs/audit-log.service.js';

/**
 * Calculates the applicable daily rent for a bungalow during check-in/out window
 * @param {object} bungalow - Bungalow document
 * @param {Date} checkIn - Requested check-in date
 * @param {Date} checkOut - Requested check-out date
 * @returns {Promise<{ standardRent: number, specialRent: number, appliedRule: object|null }>}
 */
export const calculateApplicablePrice = async (bungalow, checkIn, checkOut) => {
  const reqCheckIn = new Date(checkIn);
  const reqCheckOut = new Date(checkOut);

  // Find active rules overlapping with booking dates
  const candidateRules = await PricingRule.find({
    isActive: true,
    startDate: { $lt: reqCheckOut },
    endDate: { $gt: reqCheckIn },
  }).lean();

  if (candidateRules.length === 0) {
    return {
      standardRent: bungalow.standardRent,
      specialRent: bungalow.standardRent,
      appliedRule: null,
    };
  }

  const bungalowIdStr = bungalow._id.toString();
  const branchIdStr = (bungalow.branch?._id || bungalow.branch).toString();

  // Score candidate rules by specificity
  const matchingRules = [];

  for (const rule of candidateRules) {
    let match = true;
    let specificityScore = 0;

    // Check bungalow match
    if (rule.applicableBungalows && rule.applicableBungalows.length > 0) {
      const bMatches = rule.applicableBungalows.some(b => b.toString() === bungalowIdStr);
      if (!bMatches) match = false;
      else specificityScore += 1000;
    }

    // Check category match
    if (match && rule.applicableCategories && rule.applicableCategories.length > 0) {
      const cMatches = rule.applicableCategories.includes(bungalow.category);
      if (!cMatches) match = false;
      else specificityScore += 100;
    }

    // Check branch match
    if (match && rule.applicableBranches && rule.applicableBranches.length > 0) {
      const brMatches = rule.applicableBranches.some(br => br.toString() === branchIdStr);
      if (!brMatches) match = false;
      else specificityScore += 10;
    }

    if (match) {
      matchingRules.push({
        rule,
        totalScore: specificityScore + (rule.priority || 1),
      });
    }
  }

  if (matchingRules.length === 0) {
    return {
      standardRent: bungalow.standardRent,
      specialRent: bungalow.standardRent,
      appliedRule: null,
    };
  }

  // Pick highest scoring rule
  matchingRules.sort((a, b) => b.totalScore - a.totalScore);
  const selectedRule = matchingRules[0].rule;

  let calculatedRent = bungalow.standardRent;

  if (selectedRule.adjustmentType === PRICING_ADJUSTMENT_TYPES.FIXED_RENT) {
    calculatedRent = Math.round(selectedRule.adjustmentValue);
  } else if (selectedRule.adjustmentType === PRICING_ADJUSTMENT_TYPES.PERCENTAGE_SURGE) {
    calculatedRent = Math.round(
      bungalow.standardRent + bungalow.standardRent * (selectedRule.adjustmentValue / 100)
    );
  } else if (selectedRule.adjustmentType === PRICING_ADJUSTMENT_TYPES.PERCENTAGE_DISCOUNT) {
    calculatedRent = Math.max(
      0,
      Math.round(
        bungalow.standardRent - bungalow.standardRent * (selectedRule.adjustmentValue / 100)
      )
    );
  }

  return {
    standardRent: bungalow.standardRent,
    specialRent: calculatedRent,
    appliedRule: {
      id: selectedRule._id,
      name: selectedRule.name,
      festivalName: selectedRule.festivalName,
      adjustmentType: selectedRule.adjustmentType,
      adjustmentValue: selectedRule.adjustmentValue,
    },
  };
};

export const createPricingRule = async (data, req) => {
  const rule = await PricingRule.create(data);

  await logAudit({
    req,
    action: 'PRICING_RULE_CREATED',
    entity: 'PRICING',
    entityId: rule._id,
    changes: data,
  });

  return rule;
};

export const getAllPricingRules = async ({ branchId, isActive, search, page = 1, limit = 20 }) => {
  const conditions = [];

  if (isActive !== undefined) {
    conditions.push({ isActive });
  }

  if (branchId) {
    conditions.push({
      $or: [{ applicableBranches: branchId }, { applicableBranches: { $size: 0 } }],
    });
  }

  if (search && search.trim()) {
    const trimmed = search.trim();
    conditions.push({
      $or: [
        { name: { $regex: trimmed, $options: 'i' } },
        { festivalName: { $regex: trimmed, $options: 'i' } },
        { description: { $regex: trimmed, $options: 'i' } },
      ],
    });
  }

  const filter =
    conditions.length === 0
      ? {}
      : conditions.length === 1
      ? conditions[0]
      : { $and: conditions };

  const skip = (page - 1) * limit;

  const [rules, total] = await Promise.all([
    PricingRule.find(filter)
      .populate('applicableBranches', 'name code')
      .populate('applicableBungalows', 'number')
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PricingRule.countDocuments(filter),
  ]);

  return {
    rules,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPricingRuleById = async id => {
  const rule = await PricingRule.findById(id)
    .populate('applicableBranches', 'name code')
    .populate('applicableBungalows', 'number');

  if (!rule) {
    throw new NotFoundError(`Pricing rule with id ${id} not found`);
  }
  return rule;
};

export const updatePricingRule = async (id, data, req) => {
  const rule = await PricingRule.findById(id);
  if (!rule) {
    throw new NotFoundError(`Pricing rule with id ${id} not found`);
  }

  const previousData = rule.toObject();
  Object.assign(rule, data);
  await rule.save();

  await logAudit({
    req,
    action: 'PRICING_RULE_UPDATED',
    entity: 'PRICING',
    entityId: rule._id,
    changes: { before: previousData, after: data },
  });

  return rule;
};

export const deletePricingRule = async (id, req) => {
  const rule = await PricingRule.findById(id);
  if (!rule) {
    throw new NotFoundError(`Pricing rule with id ${id} not found`);
  }

  await PricingRule.findByIdAndDelete(id);

  await logAudit({
    req,
    action: 'PRICING_RULE_DELETED',
    entity: 'PRICING',
    entityId: id,
    changes: { name: rule.name, festivalName: rule.festivalName },
  });

  return { message: `Pricing rule ${rule.name} deleted successfully` };
};

