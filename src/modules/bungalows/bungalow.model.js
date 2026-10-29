import mongoose from 'mongoose';
import { BUNGALOW_CATEGORIES, BUNGALOW_MAINTENANCE_STATUS } from '../../config/constants.js';

const bungalowSchema = new mongoose.Schema(
  {
    number: {
      type: String,
      required: [true, 'Bungalow number is required'],
      trim: true,
      uppercase: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch reference is required'],
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(BUNGALOW_CATEGORIES),
      required: [true, 'Category is required'],
      index: true,
    },
    // Standard rent in integer paise (e.g., 500000 paise = INR 5000)
    standardRent: {
      type: Number,
      required: [true, 'Standard rent is required'],
      min: [0, 'Rent cannot be negative'],
    },
    capacity: {
      adults: { type: Number, default: 2, min: 1 },
      children: { type: Number, default: 1, min: 0 },
      maxGuests: { type: Number, default: 4, min: 1 },
    },
    facilities: [
      {
        type: String,
        trim: true,
      },
    ],
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    maintenanceStatus: {
      type: String,
      enum: Object.values(BUNGALOW_MAINTENANCE_STATUS),
      default: BUNGALOW_MAINTENANCE_STATUS.NONE,
      index: true,
    },
    photos: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index: Bungalow number must be unique within its branch
bungalowSchema.index({ branch: 1, number: 1 }, { unique: true });
bungalowSchema.index({ branch: 1, category: 1, isActive: 1 });

export const Bungalow = mongoose.model('Bungalow', bungalowSchema);
