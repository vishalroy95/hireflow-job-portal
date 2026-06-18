const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['application', 'interview', 'message', 'job', 'profile-view', 'system', 'billing'],
      default: 'system',
    },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    readAt: { type: Date, default: null },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
