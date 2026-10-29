import mongoose from 'mongoose';
import { PAYMENT_MODES, PAYMENT_TYPES } from '../../config/constants.js';

const paymentSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      index: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch reference is required'],
      index: true,
    },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
    },
    // Amount in integer paise (> 0)
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [1, 'Payment amount must be greater than zero'],
    },
    type: {
      type: String,
      enum: Object.values(PAYMENT_TYPES),
      default: PAYMENT_TYPES.BALANCE,
    },
    paymentMode: {
      type: String,
      enum: Object.values(PAYMENT_MODES),
      required: [true, 'Payment mode is required'],
      index: true,
    },
    transactionReference: {
      type: String,
      trim: true,
      default: '',
    },
    collectingUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
    },
    // Ledger reversal tracking
    isReversal: {
      type: Boolean,
      default: false,
      index: true,
    },
    reversalOfPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    reversalReason: {
      type: String,
      default: '',
    },
    reversedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable ledger: no updatedAt!
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

paymentSchema.index({ branch: 1, createdAt: -1 });
paymentSchema.index({ collectingUser: 1, createdAt: -1 });
paymentSchema.index({ paymentMode: 1, createdAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
