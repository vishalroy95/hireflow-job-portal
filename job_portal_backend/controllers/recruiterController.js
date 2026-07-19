const path = require('path');
const Application = require('../models/Application');
const Company = require('../models/Company');
const Interview = require('../models/Interview');
const Job = require('../models/Job');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const RecruiterProfile = require('../models/RecruiterProfile');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const Subscription = require('../models/Subscription');
const { notifyCandidateApplicationStatus } = require('../utils/applicationStatusNotifications');
const { applyCandidatePrivacyToApplications } = require('../utils/candidatePrivacy');
const { notifyCandidatesAboutNewJob } = require('../utils/jobNotifications');
const { getOrCreateSettings } = require('../utils/platformSettings');
const { logEvent } = require('../utils/systemLogger');

const validApplicationStatuses = [
  'pending',
  'applied',
  'under-review',
  'shortlisted',
  'interview-scheduled',
  'selected',
  'accepted',
  'rejected',
];

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const publicCompanyLogoPath = (file) => `/uploads/company-logos/${path.basename(file.filename)}`;

const getRecruiterSubscription = async (recruiterId) => {
  const subscription = await Subscription.findOneAndUpdate(
    { recruiterId },
    { recruiterId },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < new Date()) {
    subscription.plan = 'free';
    subscription.status = 'active';
    subscription.jobPostingLimit = 3;
    subscription.resumeUnlockCredits = 10;
    subscription.premiumJobCredits = 0;
    subscription.currentPeriodEnd = null;
    await subscription.save();
  }

  return subscription;
};

const assertCanPostJob = async ({ recruiterId, wantsFeatured }) => {
  const settings = await getOrCreateSettings();
  const paymentSettings = settings.payments || {};

  if (!paymentSettings.enabled || !paymentSettings.requirePaymentForJobPost) {
    return getRecruiterSubscription(recruiterId);
  }

  const subscription = await getRecruiterSubscription(recruiterId);
  const activeJobs = await Job.countDocuments({ createdBy: recruiterId, active: true, status: 'active' });
  const effectiveJobLimit = !paymentSettings.allowFreePlan && subscription.plan === 'free'
    ? 0
    : subscription.jobPostingLimit;

  if (activeJobs >= effectiveJobLimit) {
    const error = new Error('Your active job limit is reached. Please upgrade a recruiter plan from Plans & Billing.');
    error.statusCode = 402;
    throw error;
  }

  if (wantsFeatured && subscription.premiumJobCredits <= 0) {
    const error = new Error('You need a featured job credit to publish this as featured. Please upgrade from Plans & Billing.');
    error.statusCode = 402;
    throw error;
  }

  return subscription;
};

const attachResumeAnalyses = async (applications) => {
  const rows = Array.isArray(applications) ? applications : [];
  if (!rows.length) return rows;

  const ids = rows.map((application) => application._id);
  const analyses = await ResumeAnalysis.find({ applicationId: { $in: ids } }).lean();
  const analysisByApplicationId = new Map(
    analyses.map((analysis) => [analysis.applicationId.toString(), analysis])
  );

  return rows.map((application) => {
    const plainApplication = typeof application.toObject === 'function' ? application.toObject() : application;
    return {
      ...plainApplication,
      resumeAnalysis: analysisByApplicationId.get(plainApplication._id.toString()) || null,
    };
  });
};

const getRecruiterHome = async (req, res, next) => {
  try {
    const jobIds = await Job.find({ createdBy: req.userId }).distinct('_id');
    const [
      company,
      profile,
      subscription,
      activeJobs,
      totalApplicants,
      shortlistedCandidates,
      interviewsScheduled,
      hiredCandidates,
      jobs,
      recentApplications,
    ] = await Promise.all([
      Company.findOne({ recruiterId: req.userId }),
      RecruiterProfile.findOne({ userId: req.userId }),
      Subscription.findOne({ recruiterId: req.userId }),
      Job.countDocuments({ createdBy: req.userId, active: true, status: 'active' }),
      Application.countDocuments({ jobId: { $in: jobIds } }),
      Application.countDocuments({ jobId: { $in: jobIds }, status: 'shortlisted' }),
      Interview.countDocuments({ recruiterId: req.userId, status: 'scheduled' }),
      Application.countDocuments({ jobId: { $in: jobIds }, status: { $in: ['selected', 'accepted'] } }),
      Job.find({ createdBy: req.userId }).sort({ createdAt: -1 }).limit(5),
      Application.find({ jobId: { $in: jobIds } })
        .populate('userId', 'name email skills contact resume profileImage bio')
        .populate('jobId', 'title company')
        .sort({ createdAt: -1 })
        .limit(6),
    ]);

    const protectedRecentApplications = await applyCandidatePrivacyToApplications(recentApplications);

    res.status(200).json({
      success: true,
      company,
      profile,
      subscription,
      stats: {
        activeJobs,
        totalApplicants,
        shortlistedCandidates,
        interviewsScheduled,
        hiredCandidates,
      },
      jobs,
      recentApplications: protectedRecentApplications,
    });
  } catch (error) {
    next(error);
  }
};

const getCompany = async (req, res, next) => {
  try {
    const company = await Company.findOne({ recruiterId: req.userId });
    const profile = await RecruiterProfile.findOne({ userId: req.userId });
    res.status(200).json({ success: true, company, profile });
  } catch (error) {
    next(error);
  }
};

const upsertCompany = async (req, res, next) => {
  try {
    const {
      name,
      website,
      logo,
      industryType,
      companySize,
      linkedinUrl,
      gstNumber,
      description,
      address,
      socialLinks,
      officeLocations,
      phone,
      designation,
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    const company = await Company.findOneAndUpdate(
      { recruiterId: req.userId },
      {
        recruiterId: req.userId,
        name,
        website,
        logo,
        industryType,
        companySize,
        linkedinUrl,
        gstNumber,
        description,
        address,
        socialLinks,
        officeLocations,
      },
      { new: true, upsert: true, runValidators: true }
    );

    const profile = await RecruiterProfile.findOneAndUpdate(
      { userId: req.userId },
      {
        userId: req.userId,
        companyId: company._id,
        phone,
        designation,
        linkedinUrl,
      },
      { new: true, upsert: true, runValidators: true }
    );

    await logEvent({
      req,
      action: 'company.profile_saved',
      category: 'recruiter',
      message: `Recruiter saved company profile: ${company.name}`,
      metadata: {
        companyId: company._id.toString(),
        company: company.name,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Company profile saved',
      company,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

const uploadCompanyLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    const logo = publicCompanyLogoPath(req.file);
    const company = await Company.findOne({ recruiterId: req.userId });
    if (!company) {
      return res.status(400).json({ success: false, message: 'Please save company information before uploading a logo' });
    }

    company.logo = logo;
    await company.save();

    res.status(200).json({
      success: true,
      message: 'Company logo uploaded',
      logo,
      company,
    });
  } catch (error) {
    next(error);
  }
};

const createRecruiterJob = async (req, res, next) => {
  try {
    const company = await Company.findOne({ recruiterId: req.userId });
    const payload = normalizeJobPayload(req.body, company);
    const subscription = await assertCanPostJob({ recruiterId: req.userId, wantsFeatured: Boolean(payload.featured) });

    const job = await Job.create({
      ...payload,
      createdBy: req.userId,
    });

    if (job.featured && subscription.premiumJobCredits > 0) {
      subscription.premiumJobCredits -= 1;
      await subscription.save();
    }

    await notifyCandidatesAboutNewJob(job);
    await logEvent({
      req,
      action: 'job.created',
      category: 'recruiter',
      message: `Recruiter created job: ${job.title}`,
      metadata: {
        jobId: job._id.toString(),
        jobTitle: job.title,
        company: job.company,
        status: job.status,
      },
    });

    res.status(201).json({ success: true, message: 'Job created', job, subscription });
  } catch (error) {
    next(error);
  }
};

const updateRecruiterJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, createdBy: req.userId });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    Object.assign(job, normalizeJobPayload(req.body, null, true));
    await job.save();

    await logEvent({
      req,
      action: 'job.updated',
      category: 'recruiter',
      message: `Recruiter updated job: ${job.title}`,
      metadata: {
        jobId: job._id.toString(),
        jobTitle: job.title,
        status: job.status,
      },
    });

    res.status(200).json({ success: true, message: 'Job updated', job });
  } catch (error) {
    next(error);
  }
};

const duplicateJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, createdBy: req.userId }).lean();
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    delete job._id;
    delete job.createdAt;
    delete job.updatedAt;
    job.title = `${job.title} Copy`;
    job.status = 'paused';
    job.active = false;
    job.featured = false;
    job.applicants = [];

    const duplicated = await Job.create(job);
    await logEvent({
      req,
      action: 'job.duplicated',
      category: 'recruiter',
      message: `Recruiter duplicated job: ${duplicated.title}`,
      metadata: {
        sourceJobId: req.params.id,
        jobId: duplicated._id.toString(),
        jobTitle: duplicated.title,
      },
    });
    res.status(201).json({ success: true, message: 'Job duplicated', job: duplicated });
  } catch (error) {
    next(error);
  }
};

const updateJobStatus = async (req, res, next) => {
  try {
    const { status, featured } = req.body;
    const existingJob = await Job.findOne({ _id: req.params.id, createdBy: req.userId });

    if (!existingJob) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const isAdminDisabled = existingJob.adminDisabled || (!existingJob.active && existingJob.status === 'active');
    if (status === 'active' && isAdminDisabled) {
      return res.status(403).json({
        success: false,
        message: 'This job was deactivated by admin. Please contact support to reactivate it.',
      });
    }

    const update = {};
    if (status) {
      update.status = status;
      update.active = status === 'active';
    }
    if (featured !== undefined) {
      if (featured && !existingJob.featured) {
        const settings = await getOrCreateSettings();
        if (settings.payments?.enabled && settings.payments?.requirePaymentForJobPost) {
          const subscription = await getRecruiterSubscription(req.userId);
          if (subscription.premiumJobCredits <= 0) {
            return res.status(402).json({
              success: false,
              message: 'You need a featured job credit to promote this job. Please upgrade from Plans & Billing.',
            });
          }
          subscription.premiumJobCredits -= 1;
          await subscription.save();
        }
      }
      update.featured = featured;
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    await logEvent({
      req,
      action: 'job.status_updated',
      category: 'recruiter',
      message: `Recruiter updated job status: ${job.title}`,
      metadata: {
        jobId: job._id.toString(),
        jobTitle: job.title,
        status: job.status,
        featured: job.featured,
      },
    });

    res.status(200).json({ success: true, message: 'Job status updated', job });
  } catch (error) {
    next(error);
  }
};

const normalizeJobPayload = (body, company, partial = false) => {
  const payload = {
    title: body.title,
    company: body.company || company?.name,
    location: body.location,
    salary: body.salary,
    description: body.description,
    skillsRequired: toArray(body.skillsRequired),
    jobType: body.jobType,
    experience: body.experience,
    openingsCount: body.openingsCount,
    workplaceType: body.workplaceType,
    responsibilities: body.responsibilities,
    requirements: body.requirements,
    status: body.status,
    featured: body.featured,
    active: body.status ? body.status === 'active' : body.active,
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
      delete payload[key];
    }
  });

  if (!partial && (!payload.title || !payload.company || !payload.location || !payload.salary || !payload.description || !payload.skillsRequired?.length)) {
    const error = new Error('Please provide title, company, location, salary, description, and skills');
    error.statusCode = 400;
    throw error;
  }

  return payload;
};

const getApplicants = async (req, res, next) => {
  try {
    const jobIds = await Job.find({ createdBy: req.userId }).distinct('_id');
    const { jobId, status, search, skill, location, sort = '-createdAt' } = req.query;
    const filter = { jobId: { $in: jobIds } };

    if (jobId) filter.jobId = jobId;
    if (status && status !== 'all') filter.status = status;
    let applications = await Application.find(filter)
      .populate('userId', 'name email skills contact resume profileImage bio')
      .populate('jobId', 'title company location skillsRequired')
      .sort(sort);

    applications = applications.filter((application) => {
      const candidate = application.userId;
      const job = application.jobId;
      const text = `${candidate?.name || ''} ${candidate?.email || ''} ${(candidate?.skills || []).join(' ')} ${job?.title || ''}`.toLowerCase();
      const matchesSearch = !search || text.includes(search.toLowerCase());
      const matchesSkill = !skill || (candidate?.skills || []).some((item) => item.toLowerCase().includes(skill.toLowerCase()));
      const matchesLocation = !location || (job?.location || '').toLowerCase().includes(location.toLowerCase());
      return matchesSearch && matchesSkill && matchesLocation;
    });

    const protectedApplications = await applyCandidatePrivacyToApplications(applications);
    const applicationsWithAnalysis = await attachResumeAnalyses(protectedApplications);

    res.status(200).json({ success: true, count: applicationsWithAnalysis.length, applications: applicationsWithAnalysis });
  } catch (error) {
    next(error);
  }
};

const recordCandidateProfileView = async (req, res, next) => {
  try {
    const jobIds = await Job.find({ createdBy: req.userId }).distinct('_id');
    const application = await Application.findOne({
      _id: req.params.id,
      jobId: { $in: jobIds },
    }).populate('jobId', 'title company');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const [company, recruiterProfile] = await Promise.all([
      Company.findOne({ recruiterId: req.userId }).select('name'),
      RecruiterProfile.findOne({ userId: req.userId }).select('designation'),
    ]);

    const companyName = company?.name || application.jobId?.company || 'A recruiter';
    const jobTitle = application.jobId?.title || 'your application';
    const since = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const existingNotification = await Notification.findOne({
      userId: application.userId,
      type: 'profile-view',
      'metadata.applicationId': application._id.toString(),
      'metadata.recruiterId': req.userId,
      createdAt: { $gte: since },
    });

    if (!existingNotification) {
      await Notification.create({
        userId: application.userId,
        type: 'profile-view',
        title: `${companyName} viewed your profile`,
        message: `Your profile was viewed for ${jobTitle}.`,
        metadata: {
          applicationId: application._id.toString(),
          jobId: application.jobId?._id?.toString(),
          recruiterId: req.userId,
          companyName,
          recruiterDesignation: recruiterProfile?.designation || '',
        },
      });
    }

    await logEvent({
      req,
      action: 'candidate.profile_viewed',
      category: 'recruiter',
      message: `${companyName} viewed a candidate profile`,
      metadata: {
        applicationId: application._id.toString(),
        candidateId: application.userId.toString(),
        jobId: application.jobId?._id?.toString(),
        jobTitle,
        company: companyName,
        candidateNotified: !existingNotification,
      },
    });

    res.status(200).json({ success: true, notified: !existingNotification });
  } catch (error) {
    next(error);
  }
};

const updateApplicantStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!validApplicationStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validApplicationStatuses.join(', ')}`,
      });
    }

    const jobIds = await Job.find({ createdBy: req.userId }).distinct('_id');
    const application = await Application.findOne({
      _id: req.params.id,
      jobId: { $in: jobIds },
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const previousStatus = application.status;
    application.status = status;
    application.reviewedAt = new Date();
    application.reviewedBy = req.userId;
    await application.save();
    await notifyCandidateApplicationStatus(application._id, previousStatus, application.status);

    await logEvent({
      req,
      action: 'application.status_updated',
      category: 'recruiter',
      message: `Recruiter moved applicant to ${application.status}`,
      metadata: {
        applicationId: application._id.toString(),
        jobId: application.jobId.toString(),
        previousStatus,
        status: application.status,
      },
    });

    res.status(200).json({ success: true, message: 'Pipeline updated', application });
  } catch (error) {
    next(error);
  }
};

const screenApplicant = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('userId', 'skills bio')
      .populate('jobId', 'skillsRequired title createdBy');

    if (!application || application.jobId?.createdBy?.toString() !== req.userId) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const candidateSkills = (application.userId?.skills || []).map((skill) => skill.toLowerCase());
    const requiredSkills = (application.jobId?.skillsRequired || []).map((skill) => skill.toLowerCase());
    const matched = requiredSkills.filter((skill) => candidateSkills.includes(skill));
    const skillMatch = requiredSkills.length ? Math.round((matched.length / requiredSkills.length) * 100) : 0;

    application.skillMatch = skillMatch;
    application.aiScreening = {
      summary: `${skillMatch}% skill match for ${application.jobId.title}.`,
      strengths: matched,
      concerns: requiredSkills.filter((skill) => !candidateSkills.includes(skill)),
    };
    await application.save();

    await logEvent({
      req,
      action: 'application.screened',
      category: 'recruiter',
      message: `Recruiter screened applicant for ${application.jobId.title}`,
      metadata: {
        applicationId: application._id.toString(),
        jobId: application.jobId._id.toString(),
        jobTitle: application.jobId.title,
        skillMatch,
      },
    });

    res.status(200).json({ success: true, application });
  } catch (error) {
    next(error);
  }
};

const scheduleInterview = async (req, res, next) => {
  try {
    const jobIds = await Job.find({ createdBy: req.userId }).distinct('_id');
    const application = await Application.findOne({ _id: req.body.applicationId, jobId: { $in: jobIds } });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const interview = await Interview.create({
      recruiterId: req.userId,
      candidateId: application.userId,
      jobId: application.jobId,
      applicationId: application._id,
      scheduledAt: req.body.scheduledAt,
      durationMinutes: req.body.durationMinutes,
      meetingLink: req.body.meetingLink,
      platform: req.body.platform,
    });

    application.status = 'interview-scheduled';
    await application.save();

    await Notification.create({
      userId: application.userId,
      type: 'interview',
      title: 'Interview scheduled',
      message: 'A recruiter scheduled an interview for your application.',
      metadata: { interviewId: interview._id },
    });

    await logEvent({
      req,
      action: 'interview.scheduled',
      category: 'recruiter',
      message: 'Recruiter scheduled an interview',
      metadata: {
        interviewId: interview._id.toString(),
        applicationId: application._id.toString(),
        jobId: application.jobId.toString(),
        candidateId: application.userId.toString(),
      },
    });

    res.status(201).json({ success: true, message: 'Interview scheduled', interview });
  } catch (error) {
    next(error);
  }
};

const getInterviews = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ recruiterId: req.userId })
      .populate('candidateId', 'name email')
      .populate('jobId', 'title')
      .sort({ scheduledAt: 1 });

    res.status(200).json({ success: true, interviews });
  } catch (error) {
    next(error);
  }
};

const updateInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, recruiterId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    res.status(200).json({ success: true, message: 'Interview updated', interview });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, applicationId, jobId, subject, body } = req.body;
    if (!receiverId || !body) {
      return res.status(400).json({ success: false, message: 'Receiver and message are required' });
    }

    const message = await Message.create({
      senderId: req.userId,
      receiverId,
      applicationId,
      jobId,
      subject,
      body,
    });

    await Notification.create({
      userId: receiverId,
      type: 'message',
      title: subject || 'New recruiter message',
      message: body.slice(0, 140),
      metadata: { messageId: message._id },
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({
      $or: [{ senderId: req.userId }, { receiverId: req.userId }],
    })
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const jobIds = await Job.find({ createdBy: req.userId }).distinct('_id');
    const [applicationsPerJob, pipeline, monthlyHiring] = await Promise.all([
      Application.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: '$jobId', count: { $sum: 1 } } },
      ]),
      Application.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Application.aggregate([
        { $match: { jobId: { $in: jobIds }, status: { $in: ['selected', 'accepted'] } } },
        { $group: { _id: { $month: '$updatedAt' }, count: { $sum: 1 } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      applicationsPerJob,
      pipeline,
      monthlyHiring,
      candidateSources: [{ source: 'Job Portal', count: await Application.countDocuments({ jobId: { $in: jobIds } }) }],
    });
  } catch (error) {
    next(error);
  }
};

const getSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { recruiterId: req.userId },
      { recruiterId: req.userId },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, subscription });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecruiterHome,
  getCompany,
  upsertCompany,
  uploadCompanyLogo,
  createRecruiterJob,
  updateRecruiterJob,
  duplicateJob,
  updateJobStatus,
  getApplicants,
  recordCandidateProfileView,
  updateApplicantStatus,
  screenApplicant,
  scheduleInterview,
  getInterviews,
  updateInterview,
  sendMessage,
  getMessages,
  getAnalytics,
  getSubscription,
};
