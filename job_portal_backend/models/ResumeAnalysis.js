const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      unique: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    provider: {
      type: String,
      default: 'gemini',
    },
    model: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['completed', 'failed'],
      default: 'completed',
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    summary: {
      type: String,
      default: '',
    },
    matchedSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    strengths: {
      type: [String],
      default: [],
    },
    concerns: {
      type: [String],
      default: [],
    },
    suggestions: {
      type: [String],
      default: [],
    },
    interviewQuestions: {
      type: [String],
      default: [],
    },
    rawResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    analyzedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

resumeAnalysisSchema.index({ candidateId: 1, createdAt: -1 });
resumeAnalysisSchema.index({ recruiterId: 1, createdAt: -1 });
resumeAnalysisSchema.index({ jobId: 1, createdAt: -1 });

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
