const mongoose = require('mongoose');

const recruiterProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    phone: { type: String, default: '' },
    designation: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    emailVerified: { type: Boolean, default: false },
    hiringPreferences: {
      industries: { type: [String], default: [] },
      locations: { type: [String], default: [] },
      defaultJobType: { type: String, default: 'Full-time' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RecruiterProfile', recruiterProfileSchema);
