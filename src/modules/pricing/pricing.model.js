import mongoose from 'mongoose';
import { PRICING_ADJUSTMENT_TYPES, BUNGALOW_CATEGORIES } from '../../config/constants.js';

const pricingRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Pricing rule or festival name is required'],
      trim: true,
    },
    festivalName: {
      type: String,
      trim: true,
      default: '',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      index: true,
    },
    // Null/empty branch means applicable to ALL branches
    applicableBranches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
      },
    ],
    // Null/empty category means applicable to ALL categories
    applicableCategories: [
      {
        type: String,
        enum: Object.values(BUNGALOW_CATEGORIES),
      },
    ],
    // Null/empty bungalow means applicable to all bungalows in category/branch
    applicableBungalows: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bungalow',
      },
    ],
    adjustmentType: {
      type: String,
      enum: Object.values(PRICING_ADJUSTMENT_TYPES),
      required: [true, 'Adjustment type is required'],
    },
    // If FIXED_RENT: amount in paise. If PERCENTAGE_SURGE/DISCOUNT: e.g. 20 for 20%
    adjustmentValue: {
      type: Number,
      required: [true, 'Adjustment value is required'],
      min: 0,
    },
    priority: {
      type: Number,
      default: 1, // Higher priority wins when multiple rules match
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

pricingRuleSchema.index({ startDate: 1, endDate: 1, isActive: 1 });

export const PricingRule = mongoose.model('PricingRule', pricingRuleSchema);
