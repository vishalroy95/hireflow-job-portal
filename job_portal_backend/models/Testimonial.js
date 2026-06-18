const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a display name'],
      trim: true,
      maxlength: 80,
    },
    roleTitle: {
      type: String,
      required: [true, 'Please provide a role or title'],
      trim: true,
      maxlength: 100,
    },
    userRole: {
      type: String,
      enum: ['candidate', 'recruiter'],
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Please provide testimonial message'],
      trim: true,
      minlength: 20,
      maxlength: 500,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 5,
    },
    avatar: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    publicConsent: {
      type: Boolean,
      required: true,
      default: false,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

testimonialSchema.index({ status: 1, isFeatured: 1, createdAt: -1 });
testimonialSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);
