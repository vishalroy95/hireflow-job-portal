const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentPlan',
      required: true,
    },
    provider: {
      type: String,
      enum: ['razorpay', 'demo'],
      default: 'razorpay',
    },
    providerOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    providerPaymentId: {
      type: String,
      default: '',
      index: true,
    },
    providerSignature: {
      type: String,
      default: '',
      select: false,
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
    status: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
      index: true,
    },
    failureReason: {
      type: String,
      default: '',
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

paymentSchema.index({ recruiterId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
