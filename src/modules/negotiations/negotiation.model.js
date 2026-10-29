import mongoose from 'mongoose';
import { NEGOTIATION_STATUS } from '../../config/constants.js';

const negotiationSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      index: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    // Rents in integer paise per night
    originalRent: {
      type: Number,
      required: true,
      min: 0,
    },
    requestedRent: {
      type: Number,
      required: [true, 'Requested rent is required'],
      min: 0,
    },
    reason: {
      type: String,
      required: [true, 'Reason for negotiation is required'],
      trim: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(NEGOTIATION_STATUS),
      default: NEGOTIATION_STATUS.PENDING,
      index: true,
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    decisionComment: {
      type: String,
      trim: true,
      default: '',
    },
    decidedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

negotiationSchema.index({ booking: 1, status: 1 });
negotiationSchema.index({ branch: 1, status: 1, createdAt: -1 });

export const Negotiation = mongoose.model('Negotiation', negotiationSchema);
