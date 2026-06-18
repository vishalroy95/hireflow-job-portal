// models/Application.js
// Application model schema definition

const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'applied',
        'under-review',
        'shortlisted',
        'interview-scheduled',
        'selected',
        'accepted',
        'rejected',
      ],
      default: 'pending',
    },
    coverLetter: {
      type: String,
      default: '',
    },
    resume: {
      type: String, // URL or file path
      default: null,
    },
    salaryExpectation: {
      type: Number,
      default: null,
    },
    education: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      default: 'Job Portal',
    },
    skillMatch: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    aiScreening: {
      summary: { type: String, default: '' },
      strengths: { type: [String], default: [] },
      concerns: { type: [String], default: [] },
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Ensure unique application per user per job
 * User cannot apply to same job twice
 */
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
