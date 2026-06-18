const mongoose = require('mongoose');

const officeLocationSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Head Office' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
  },
  { _id: false }
);

const companySchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: { type: String, required: true, trim: true },
    website: { type: String, default: '' },
    logo: { type: String, default: '' },
    industryType: { type: String, default: '' },
    companySize: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
    gstNumber: { type: String, default: '' },
    description: { type: String, default: '' },
    address: { type: String, default: '' },
    socialLinks: {
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
      facebook: { type: String, default: '' },
    },
    officeLocations: {
      type: [officeLocationSchema],
      default: [],
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
