const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 30 },
    meetingLink: { type: String, default: '' },
    platform: {
      type: String,
      enum: ['Google Meet', 'Zoom', 'Phone', 'In Person', 'Other'],
      default: 'Google Meet',
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    feedback: { type: String, default: '' },
    rating: { type: Number, min: 0, max: 5, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);
