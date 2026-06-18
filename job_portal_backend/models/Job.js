// models/Job.js
// Job model schema definition

const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a job title'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Please provide a company name'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Please provide a location'],
      trim: true,
    },
    salary: {
      min: {
        type: Number,
        required: [true, 'Please provide minimum salary'],
      },
      max: {
        type: Number,
        required: [true, 'Please provide maximum salary'],
      },
      currency: {
        type: String,
        enum: ['INR'],
        default: 'INR',
      },
    },
    openingsCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    description: {
      type: String,
      required: [true, 'Please provide job description'],
    },
    responsibilities: {
      type: String,
      default: '',
    },
    requirements: {
      type: String,
      default: '',
    },
    skillsRequired: {
      type: [String],
      required: [true, 'Please provide required skills'],
    },
    jobType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
      default: 'Full-time',
    },
    experience: {
      type: String,
      enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Executive', '0-1 years', '1-3 years', '3-5 years', '5+ years'],
      default: 'Entry Level',
    },
    workplaceType: {
      type: String,
      enum: ['Onsite', 'Remote', 'Hybrid'],
      default: 'Onsite',
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'closed'],
      default: 'active',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    adminDisabled: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    applicants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Job', jobSchema);
