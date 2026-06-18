// models/User.js
// User model schema definition

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === 'local';
      },
      minlength: 6,
      select: false, // Do not return password when querying
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    providerId: {
      type: String,
      default: '',
      select: false,
    },
    role: {
      type: String,
      enum: ['candidate', 'recruiter', 'admin'],
      default: 'candidate',
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    recruiterStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },
    resetOtpHash: {
      type: String,
      default: null,
      select: false,
    },
    resetOtpExpires: {
      type: Date,
      default: null,
      select: false,
    },
    resetOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
      select: false,
    },
    skills: {
      type: [String],
      default: [],
    },
    resume: {
      type: String, // URL or file path to resume
      default: null,
    },
    profileImage: {
      type: String, // URL or file path to profile image
      default: null,
    },
    bio: {
      type: String,
      default: '',
    },
    contact: {
      phone: String,
      linkedin: String,
      github: String,
      portfolio: String,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

/**
 * Hash password before saving user document
 * Only executes if password field is modified
 */
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Method to compare entered password with hashed password
 * Returns boolean value
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    return false;
  }

  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
