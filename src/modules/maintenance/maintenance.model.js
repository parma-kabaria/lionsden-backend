import mongoose from 'mongoose';
import { MAINTENANCE_PRIORITY, MAINTENANCE_STATUS } from '../../config/constants.js';

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: Object.values(MAINTENANCE_STATUS),
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const maintenanceTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
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
    facilityAffected: {
      type: String,
      required: [true, 'Facility or entire bungalow must be specified'],
      trim: true, // e.g. "Air Conditioning", "Geyser", "Entire Bungalow"
    },
    problemDescription: {
      type: String,
      required: [true, 'Problem description is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: Object.values(MAINTENANCE_PRIORITY),
      default: MAINTENANCE_PRIORITY.MEDIUM,
      index: true,
    },
    blocksAvailability: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(MAINTENANCE_STATUS),
      default: MAINTENANCE_STATUS.REPORTED,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

maintenanceTicketSchema.index({ bungalow: 1, status: 1 });
maintenanceTicketSchema.index({ branch: 1, status: 1, priority: 1 });

export const MaintenanceTicket = mongoose.model('MaintenanceTicket', maintenanceTicketSchema);
