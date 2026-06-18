const Application = require('../models/Application');
const Notification = require('../models/Notification');
const { sendTemplateEmail } = require('./emailService');

const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');
const frontendUrl = trimTrailingSlash(process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173');
const candidateFrontendUrl = trimTrailingSlash(process.env.CANDIDATE_FRONTEND_URL || frontendUrl);

const statusEmailMap = {
  shortlisted: {
    eventKey: 'applicationShortlisted',
    title: 'Application shortlisted',
    message: 'Your application has been shortlisted.',
  },
  rejected: {
    eventKey: 'applicationRejected',
    title: 'Application update',
    message: 'Your application status has been updated.',
  },
};

const notifyCandidateApplicationStatus = async (applicationId, previousStatus, nextStatus) => {
  const statusConfig = statusEmailMap[nextStatus];

  if (!statusConfig || previousStatus === nextStatus) {
    return;
  }

  const application = await Application.findById(applicationId)
    .populate('userId', 'name email')
    .populate('jobId', 'title company');

  const candidate = application?.userId;
  const job = application?.jobId;

  if (!candidate || !job) {
    return;
  }

  await Notification.create({
    userId: candidate._id || candidate,
    type: 'application',
    title: statusConfig.title,
    message: `${statusConfig.message} Job: ${job.title}.`,
    metadata: {
      applicationId: application._id,
      jobId: job._id,
      status: nextStatus,
    },
  });

  try {
    await sendTemplateEmail(statusConfig.eventKey, candidate.email, {
      candidateName: candidate.name || 'Candidate',
      jobTitle: job.title,
      company: job.company,
      status: nextStatus,
      actionText: 'View application',
      actionUrl: `${candidateFrontendUrl}/candidate/dashboard`,
    });
  } catch (error) {
    console.warn(`[email] Failed to send ${nextStatus} application email: ${error.message || error}`);
  }
};

module.exports = {
  notifyCandidateApplicationStatus,
};
