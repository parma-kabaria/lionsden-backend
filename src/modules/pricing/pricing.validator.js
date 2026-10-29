import { z } from 'zod';
import { objectIdSchema } from '../../common/validators/id.validator.js';
import { PRICING_ADJUSTMENT_TYPES, BUNGALOW_CATEGORIES } from '../../config/constants.js';
import { paginationQuerySchema } from '../../common/validators/pagination.validator.js';

export const getPricingRulesQuerySchema = paginationQuerySchema
  .extend({
    branchId: objectIdSchema.optional(),
    isActive: z.enum(['true', 'false']).optional(),
  })
  .passthrough();

const pricingRuleBaseSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  festivalName: z.string().trim().optional().nullable().default(''),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  applicableBranches: z.array(objectIdSchema).default([]),
  applicableCategories: z.array(z.nativeEnum(BUNGALOW_CATEGORIES)).default([]),
  applicableBungalows: z.array(objectIdSchema).default([]),
  adjustmentType: z.nativeEnum(PRICING_ADJUSTMENT_TYPES),
  adjustmentValue: z.number().min(0, 'Adjustment value cannot be negative'),
  priority: z.number().int().default(1),
  isActive: z.boolean().default(true),
  description: z.string().trim().optional().nullable().default(''),
});

export const createPricingRuleSchema = pricingRuleBaseSchema.refine(
  data => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

export const updatePricingRuleSchema = pricingRuleBaseSchema.partial().refine(
  data => {
    if (data.startDate && data.endDate) {
      return data.endDate > data.startDate;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

