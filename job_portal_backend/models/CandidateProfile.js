const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, default: '' },
    institution: { type: String, default: '' },
    startYear: { type: String, default: '' },
    endYear: { type: String, default: '' },
    grade: { type: String, default: '' },
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    company: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const viewedJobSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    viewedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const candidateProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    profileImage: { type: String, default: '' },
    resume: { type: String, default: '' },
    resumeFile: {
      originalName: { type: String, default: '' },
      size: { type: Number, default: 0 },
      mimeType: { type: String, default: '' },
      uploadedAt: { type: Date, default: null },
    },
    portfolioUrl: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    education: { type: [educationSchema], default: [] },
    experience: { type: [experienceSchema], default: [] },
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
    recentlyViewedJobs: { type: [viewedJobSchema], default: [] },
    resumeParsed: {
      headline: { type: String, default: '' },
      skills: { type: [String], default: [] },
      experienceYears: { type: Number, default: 0 },
      lastParsedAt: { type: Date, default: null },
    },
    privacy: {
      visibleToRecruiters: { type: Boolean, default: true },
      showContactInfo: { type: Boolean, default: true },
      jobAlerts: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CandidateProfile', candidateProfileSchema);
