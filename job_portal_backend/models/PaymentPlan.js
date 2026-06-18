const mongoose = require('mongoose');

const paymentPlanSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['INR'],
      default: 'INR',
    },
    durationDays: {
      type: Number,
      default: 30,
      min: 1,
    },
    jobPostingLimit: {
      type: Number,
      default: 1,
      min: 0,
    },
    premiumJobCredits: {
      type: Number,
      default: 0,
      min: 0,
    },
    resumeUnlockCredits: {
      type: Number,
      default: 10,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentPlan', paymentPlanSchema);
