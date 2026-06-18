const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'platform',
      unique: true,
      immutable: true,
    },
    general: {
      siteName: { type: String, default: 'HireFlow' },
      siteTitle: { type: String, default: 'HireFlow - Job Portal' },
      supportEmail: { type: String, default: 'support@hireflow.com' },
      supportPhone: { type: String, default: '' },
      defaultCurrency: { type: String, default: 'INR' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      maintenanceMode: { type: Boolean, default: false },
      allowCandidateRegistration: { type: Boolean, default: true },
      allowRecruiterRegistration: { type: Boolean, default: true },
    },
    branding: {
      logoUrl: { type: String, default: '' },
      bannerUrl: { type: String, default: '' },
      faviconUrl: { type: String, default: '' },
      primaryColor: { type: String, default: '#2563eb' },
      secondaryColor: { type: String, default: '#0f172a' },
      footerText: { type: String, default: 'HireFlow connects candidates and recruiters.' },
    },
    email: {
      provider: { type: String, default: 'smtp' },
      fromName: { type: String, default: 'HireFlow' },
      fromEmail: { type: String, default: 'no-reply@hireflow.com' },
      smtpHost: { type: String, default: 'smtp.gmail.com' },
      smtpPort: { type: Number, default: 465 },
      smtpSecure: { type: Boolean, default: true },
      smtpUser: { type: String, default: '' },
      smtpPassword: { type: String, default: '' },
      enableEmailVerification: { type: Boolean, default: true },
      enableJobAlerts: { type: Boolean, default: true },
      events: {
        registrationOtp: { type: Boolean, default: true },
        passwordResetOtp: { type: Boolean, default: true },
        applicationSubmitted: { type: Boolean, default: true },
        applicationReceived: { type: Boolean, default: true },
        applicationShortlisted: { type: Boolean, default: true },
        applicationRejected: { type: Boolean, default: true },
        supportReply: { type: Boolean, default: true },
      },
      templates: {
        registrationOtp: {
          subject: { type: String, default: 'Verify your HireFlow account' },
          body: {
            type: String,
            default: 'Hello {{name}},\n\nYour HireFlow verification code is {{otp}}.\nThis code expires in {{minutes}} minutes.\n\nIf you did not request this account, you can ignore this email.\n\n{{siteName}}',
          },
        },
        passwordResetOtp: {
          subject: { type: String, default: 'Your HireFlow password reset OTP' },
          body: {
            type: String,
            default: 'Hello {{name}},\n\nYour password reset OTP is {{otp}}.\nThis OTP expires in {{minutes}} minutes.\n\nIf you did not request this, you can ignore this email.\n\n{{siteName}}',
          },
        },
        applicationSubmitted: {
          subject: { type: String, default: 'Application submitted for {{jobTitle}}' },
          body: {
            type: String,
            default: 'Hello {{candidateName}},\n\nYour application for {{jobTitle}} at {{company}} has been submitted successfully.\n\n{{siteName}}',
          },
        },
        applicationReceived: {
          subject: { type: String, default: 'New application received for {{jobTitle}}' },
          body: {
            type: String,
            default: 'Hello {{recruiterName}},\n\n{{candidateName}} applied for {{jobTitle}}.\n\nPlease review the application in your recruiter workspace.\n\n{{siteName}}',
          },
        },
        applicationShortlisted: {
          subject: { type: String, default: 'You have been shortlisted for {{jobTitle}}' },
          body: {
            type: String,
            default: 'Hello {{candidateName}},\n\nGood news. Your application for {{jobTitle}} at {{company}} has been shortlisted.\n\nPlease keep an eye on your dashboard for the next update.\n\n{{siteName}}',
          },
        },
        applicationRejected: {
          subject: { type: String, default: 'Update on your application for {{jobTitle}}' },
          body: {
            type: String,
            default: 'Hello {{candidateName}},\n\nThank you for applying for {{jobTitle}} at {{company}}.\n\nAfter review, your application was not selected for this role. We encourage you to keep exploring new opportunities on {{siteName}}.\n\n{{siteName}}',
          },
        },
        supportReply: {
          subject: { type: String, default: 'Support ticket updated: {{subject}}' },
          body: {
            type: String,
            default: 'Hello {{name}},\n\nAdmin replied to your support ticket: {{subject}}.\n\n{{message}}\n\n{{siteName}}',
          },
        },
      },
    },
    currency: {
      baseCurrency: { type: String, default: 'INR', enum: ['INR'] },
      usdRate: { type: Number, default: 0.012 },
    },
    ai: {
      resumeAnalyzerEnabled: { type: Boolean, default: false },
      provider: { type: String, default: 'gemini', enum: ['gemini'] },
      model: { type: String, default: 'gemini-2.5-flash' },
      manualOnly: { type: Boolean, default: true },
      maxAnalysesPerDay: { type: Number, default: 50, min: 1 },
    },
    payments: {
      enabled: { type: Boolean, default: false },
      provider: { type: String, default: 'razorpay', enum: ['razorpay'] },
      requirePaymentForJobPost: { type: Boolean, default: true },
      allowFreePlan: { type: Boolean, default: true },
      mode: { type: String, default: 'demo', enum: ['demo', 'test', 'live'] },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
