import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, 'Branch code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: 10,
    },
    type: {
      type: String,
      enum: ['RESORT', 'HEAD_OFFICE'],
      default: 'RESORT',
      index: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      trim: true,
      default: 'Gujarat',
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const Branch = mongoose.model('Branch', branchSchema);
