import mongoose from 'mongoose';

/**
 * AuditEvent model for tracking security-related admin actions
 * Stores immutable audit trail for compliance and security monitoring
 */
const auditEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: ['ACCOUNT_UNLOCK', 'PASSWORD_RESET_REQUIRED', 'USER_DELETED', 'LOCKOUT_TRIGGERED'],
      index: true
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    adminEmail: {
      type: String,
      required: true
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetUserEmail: {
      type: String,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  {
    timestamps: true,
    // Prevent modifications to audit logs
    strict: true
  }
);

// Index for efficient queries
auditEventSchema.index({ createdAt: -1 });
auditEventSchema.index({ eventType: 1, createdAt: -1 });

const AuditEvent = mongoose.models.AuditEvent || mongoose.model('AuditEvent', auditEventSchema);

export default AuditEvent;
