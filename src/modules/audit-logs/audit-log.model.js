import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      name: {
        type: String,
        default: 'System',
      },
      role: {
        type: String,
        default: 'SYSTEM',
      },
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entity: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      default: null,
      index: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
      index: true,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable: no updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ branch: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
