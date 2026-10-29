import mongoose from 'mongoose';
import { BOOKING_STATUS, FOOD_OPTIONS } from '../../config/constants.js';

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    customer: {
      name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, 'Customer mobile number is required'],
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: '',
      },
      customerRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        default: null,
      },
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch reference is required'],
      index: true,
    },
    bungalow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bungalow',
      required: [true, 'Bungalow reference is required'],
      index: true,
    },
    checkIn: {
      type: Date,
      required: [true, 'Check-in date is required'],
      index: true,
    },
    checkOut: {
      type: Date,
      required: [true, 'Check-out date is required'],
      index: true,
    },
    nights: {
      type: Number,
      required: true,
      min: 1,
    },
    guests: {
      adults: { type: Number, default: 2, min: 1 },
      children: { type: Number, default: 0, min: 0 },
    },
    foodOption: {
      type: String,
      enum: Object.values(FOOD_OPTIONS),
      default: FOOD_OPTIONS.WITHOUT_FOOD,
    },
    foodChargesPerNight: {
      type: Number,
      default: 0, // in paise
      min: 0,
    },
    totalFoodCharges: {
      type: Number,
      default: 0, // in paise
      min: 0,
    },
    // Pricing details in integer paise
    standardRentPerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    specialRentPerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    finalRentPerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    appliedPricingRule: {
      id: { type: mongoose.Schema.Types.ObjectId, default: null },
      name: { type: String, default: '' },
      festivalName: { type: String, default: '' },
    },
    extraCharges: {
      type: Number,
      default: 0, // in paise
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true, // in paise: (finalRentPerNight * nights) + totalFoodCharges + extraCharges
      min: 0,
    },
    advancePayment: {
      type: Number,
      default: 0, // in paise
      min: 0,
    },
    totalPaid: {
      type: Number,
      default: 0, // in paise
      min: 0,
    },
    outstandingBalance: {
      type: Number,
      required: true, // in paise: totalAmount - totalPaid
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.CONFIRMED,
      index: true,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    specialRequests: {
      type: String,
      trim: true,
      default: '',
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for overlap detection and branch querying
bookingSchema.index({ bungalow: 1, status: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ branch: 1, status: 1, checkIn: 1 });
bookingSchema.index({ 'customer.phone': 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
