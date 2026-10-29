import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Role code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const Role = mongoose.model('Role', roleSchema);
