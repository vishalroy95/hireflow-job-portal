const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorRole: {
      type: String,
      enum: ['candidate', 'recruiter', 'admin', 'guest', 'system'],
      default: 'system',
    },
    actorEmail: { type: String, default: '' },
    action: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: ['auth', 'admin', 'recruiter', 'candidate', 'application', 'email', 'support', 'ai', 'payment', 'system'],
      default: 'system',
      index: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error'],
      default: 'info',
      index: true,
    },
    message: { type: String, required: true },
    metadata: { type: Object, default: {} },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

systemLogSchema.index({ createdAt: -1 });
systemLogSchema.index({ category: 1, severity: 1, createdAt: -1 });

module.exports = mongoose.model('SystemLog', systemLogSchema);
