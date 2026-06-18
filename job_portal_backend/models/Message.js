const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
    },
    subject: { type: String, default: '' },
    body: { type: String, required: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
