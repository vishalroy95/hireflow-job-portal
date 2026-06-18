const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    plan: {
      type: String,
      default: 'free',
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['active', 'past_due', 'cancelled'],
      default: 'active',
    },
    jobPostingLimit: { type: Number, default: 3 },
    resumeUnlockCredits: { type: Number, default: 10 },
    premiumJobCredits: { type: Number, default: 0 },
    currentPeriodEnd: { type: Date, default: null },
    lastPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    paymentProvider: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
