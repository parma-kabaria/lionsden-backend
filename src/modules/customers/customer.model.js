import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    idProofType: {
      type: String,
      enum: ['AADHAAR', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'OTHER', 'NONE'],
      default: 'NONE',
    },
    idProofNumber: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
      index: true,
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

customerSchema.index({ name: 'text', phone: 'text', email: 'text' });

export const Customer = mongoose.model('Customer', customerSchema);
