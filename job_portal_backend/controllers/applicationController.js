// controllers/applicationController.js
// Application controller - manage job applications

const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const SystemLog = require('../models/SystemLog');
const { sendTemplateEmail } = require('../utils/emailService');
const CandidateProfile = require('../models/CandidateProfile');
const { notifyCandidateApplicationStatus } = require('../utils/applicationStatusNotifications');
const { applyCandidatePrivacyToApplications } = require('../utils/candidatePrivacy');
const { getOrCreateSettings } = require('../utils/platformSettings');
const { logEvent } = require('../utils/systemLogger');
const { analyzeResumeWithGemini } = require('../utils/resumeAnalyzer');

const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');
const frontendUrl = trimTrailingSlash(process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173');
const candidateFrontendUrl = trimTrailingSlash(process.env.CANDIDATE_FRONTEND_URL || frontendUrl);
const recruiterFrontendUrl = trimTrailingSlash(process.env.RECRUITER_FRONTEND_URL || frontendUrl);

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

const getApplicationAnalysisContext = async (applicationId) => {
  const application = await Application.findById(applicationId)
    .populate('userId', 'name email skills contact resume profileImage bio')
    .populate('jobId');

  if (!application) return null;

  const profile = await CandidateProfile.findOne({ userId: application.userId?._id || application.userId }).lean();
  return { application, candidate: application.userId, job: application.jobId, profile };
};

const canAnalyzeApplication = (req, application) => {
  const candidateId = application.userId?._id || application.userId;
  const recruiterId = application.jobId?.createdBy;

  if (req.userRole === 'candidate') {
    return candidateId?.toString() === req.userId;
  }

  if (req.userRole === 'recruiter') {
    return recruiterId?.toString() === req.userId;
  }

  if (req.userRole === 'admin') {
    return true;
  }

  return false;
};

/**
 * Apply for a job
 * POST /api/applications/apply/:jobId
 * Only candidates can apply
 */
const applyForJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { coverLetter, resume, salaryExpectation, education } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId).populate('createdBy', 'name email');
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({
      userId: req.userId,
      jobId,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job',
      });
    }

    // Get user to retrieve resume
    const [user, profile] = await Promise.all([
      User.findById(req.userId),
      CandidateProfile.findOne({ userId: req.userId }),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const selectedResume = resume || user.resume || profile?.resume || '';

    if (!selectedResume) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume before applying for this job',
      });
    }

    const candidateSkills = (user.skills || []).map((skill) => skill.toLowerCase());
    const requiredSkills = (job.skillsRequired || []).map((skill) => skill.toLowerCase());
    const matchedSkills = requiredSkills.filter((skill) => candidateSkills.includes(skill));
    const skillMatch = requiredSkills.length ? Math.round((matchedSkills.length / requiredSkills.length) * 100) : 0;

    // Create application
    const application = await Application.create({
      userId: req.userId,
      jobId,
      coverLetter: coverLetter || '',
      resume: selectedResume,
      salaryExpectation,
      education,
      skillMatch,
      aiScreening: {
        summary: `${skillMatch}% skill match based on candidate profile skills.`,
        strengths: matchedSkills,
        concerns: requiredSkills.filter((skill) => !candidateSkills.includes(skill)),
      },
    });

    // Add application to job's applicants list
    job.applicants.push(application._id);
    await job.save();

    await logEvent({
      req,
      actor: user,
      action: 'application.submitted',
      category: 'application',
      message: `${user.name || 'Candidate'} applied for ${job.title}`,
      metadata: {
        applicationId: application._id.toString(),
        jobId: job._id.toString(),
        jobTitle: job.title,
        company: job.company,
      },
    });

    if (job.createdBy) {
      await Notification.create({
        userId: job.createdBy._id || job.createdBy,
        type: 'application',
        title: 'New application received',
        message: `${user.name || 'A candidate'} applied for ${job.title}.`,
        metadata: {
          applicationId: application._id,
          candidateId: req.userId,
          jobId: job._id,
        },
      });
    }

    const emailResults = await Promise.allSettled([
      sendTemplateEmail('applicationSubmitted', user.email, {
        candidateName: user.name || 'Candidate',
        jobTitle: job.title,
        company: job.company,
        actionText: 'View application',
        actionUrl: `${candidateFrontendUrl}/candidate/dashboard`,
      }),
      job.createdBy?.email
        ? sendTemplateEmail('applicationReceived', job.createdBy.email, {
            recruiterName: job.createdBy.name || 'Recruiter',
            candidateName: user.name || 'A candidate',
            jobTitle: job.title,
            company: job.company,
            actionText: 'Review application',
            actionUrl: `${recruiterFrontendUrl}/recruiter/dashboard`,
          })
        : Promise.resolve(),
    ]);

    emailResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        const emailType = index === 0 ? 'candidate application confirmation' : 'recruiter application alert';
        console.warn(`[email] Failed to send ${emailType}: ${result.reason?.message || result.reason}`);
        logEvent({
          req,
          action: 'email.send_failed',
          category: 'email',
          severity: 'warning',
          message: `Failed to send ${emailType}`,
          metadata: {
            emailType,
            reason: result.reason?.message || String(result.reason),
            applicationId: application._id.toString(),
          },
        });
      }
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all applications for current user
 * GET /api/applications/my-applications
 */
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ userId: req.userId })
      .populate('jobId', 'title company location salary jobType workplaceType')
      .sort({ appliedAt: -1 });
    const applicationsWithAnalysis = await attachResumeAnalyses(applications);

    res.status(200).json({
      success: true,
      count: applicationsWithAnalysis.length,
      applications: applicationsWithAnalysis,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all applications for a specific job (recruiter only)
 * GET /api/applications/job/:jobId
 */
const getJobApplications = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    // Check if job exists and belongs to recruiter
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    if (job.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view applications for this job',
      });
    }

    const applications = await Application.find({ jobId })
      .populate('userId', 'name email skills contact')
      .sort({ appliedAt: -1 });
    const protectedApplications = await applyCandidatePrivacyToApplications(applications);
    const applicationsWithAnalysis = await attachResumeAnalyses(protectedApplications);

    res.status(200).json({
      success: true,
      count: applicationsWithAnalysis.length,
      applications: applicationsWithAnalysis,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Analyze a resume/application against a job using the configured AI provider
 * POST /api/applications/:id/analyze
 */
const analyzeApplicationResume = async (req, res, next) => {
  try {
    const context = await getApplicationAnalysisContext(req.params.id);

    if (!context?.application || !canAnalyzeApplication(req, context.application)) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const force = req.body?.force === true;
    const existingAnalysis = await ResumeAnalysis.findOne({ applicationId: context.application._id });

    if (existingAnalysis && !force) {
      return res.status(200).json({
        success: true,
        cached: true,
        message: 'Resume analysis already exists',
        analysis: existingAnalysis,
      });
    }

    const settings = await getOrCreateSettings();
    const dailyLimit = Number(settings.ai?.maxAnalysesPerDay || 0);
    if (dailyLimit > 0) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const analysesToday = await SystemLog.countDocuments({
        category: 'ai',
        action: 'ai.resume_analyzed',
        createdAt: { $gte: startOfDay },
      });

      if (analysesToday >= dailyLimit) {
        return res.status(429).json({
          success: false,
          message: `Daily AI resume analysis limit reached (${dailyLimit}). Increase the limit from Admin Settings.`,
        });
      }
    }

    const analysis = await analyzeResumeWithGemini(context);

    const savedAnalysis = await ResumeAnalysis.findOneAndUpdate(
      { applicationId: context.application._id },
      {
        applicationId: context.application._id,
        candidateId: context.application.userId._id || context.application.userId,
        recruiterId: context.application.jobId.createdBy || null,
        jobId: context.application.jobId._id || context.application.jobId,
        provider: analysis.provider,
        model: analysis.model,
        status: 'completed',
        matchScore: analysis.matchScore,
        summary: analysis.summary,
        matchedSkills: analysis.matchedSkills,
        missingSkills: analysis.missingSkills,
        strengths: analysis.strengths,
        concerns: analysis.concerns,
        suggestions: analysis.suggestions,
        interviewQuestions: analysis.interviewQuestions,
        rawResponse: analysis.rawResponse,
        analyzedAt: new Date(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    context.application.skillMatch = savedAnalysis.matchScore;
    context.application.aiScreening = {
      summary: savedAnalysis.summary,
      strengths: savedAnalysis.strengths,
      concerns: savedAnalysis.concerns,
    };
    await context.application.save();

    await logEvent({
      req,
      action: 'ai.resume_analyzed',
      category: 'ai',
      message: `AI resume analysis completed for ${context.job.title}`,
      metadata: {
        applicationId: context.application._id.toString(),
        jobId: context.job._id.toString(),
        jobTitle: context.job.title,
        provider: savedAnalysis.provider,
        model: savedAnalysis.model,
        matchScore: savedAnalysis.matchScore,
      },
    });

    res.status(200).json({
      success: true,
      cached: false,
      message: 'Resume analysis completed',
      analysis: savedAnalysis,
    });
  } catch (error) {
    await logEvent({
      req,
      action: 'ai.resume_analysis_failed',
      category: 'ai',
      severity: 'error',
      message: 'AI resume analysis failed',
      metadata: {
        applicationId: req.params.id,
        reason: error.message,
        details: error.details,
      },
    });
    next(error);
  }
};

/**
 * Get saved resume analysis for an application
 * GET /api/applications/:id/analysis
 */
const getApplicationAnalysis = async (req, res, next) => {
  try {
    const context = await getApplicationAnalysisContext(req.params.id);

    if (!context?.application || !canAnalyzeApplication(req, context.application)) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const analysis = await ResumeAnalysis.findOne({ applicationId: context.application._id });

    res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update application status
 * PUT /api/applications/status/:id
 * Only recruiter who created the job can update status
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = [
      'pending',
      'applied',
      'under-review',
      'shortlisted',
      'interview-scheduled',
      'selected',
      'accepted',
      'rejected',
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Check if user is the recruiter who created the job
    const job = await Job.findById(application.jobId);
    if (job.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this application',
      });
    }

    const previousStatus = application.status;

    // Update application
    application.status = status;
    application.reviewedAt = new Date();
    application.reviewedBy = req.userId;

    await application.save();
    await notifyCandidateApplicationStatus(application._id, previousStatus, application.status);

    await logEvent({
      req,
      action: 'application.status_updated',
      category: 'recruiter',
      message: `Application status changed to ${status}`,
      metadata: {
        applicationId: application._id.toString(),
        jobId: application.jobId.toString(),
        previousStatus,
        status,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get application statistics for current user
 * GET /api/applications/stats
 */
const getMyApplicationStats = async (req, res, next) => {
  try {
    const match = req.userRole === 'recruiter' ? {} : { userId: req.userId };

    if (req.userRole === 'recruiter') {
      const jobs = await Job.find({ createdBy: req.userId }).select('_id');
      match.jobId = { $in: jobs.map((job) => job._id) };
    }

    const [totalApplications, pendingApplications, shortlistedApplications, totalJobs] = await Promise.all([
      Application.countDocuments(match),
      Application.countDocuments({ ...match, status: 'pending' }),
      Application.countDocuments({ ...match, status: 'shortlisted' }),
      req.userRole === 'recruiter' ? Job.countDocuments({ createdBy: req.userId }) : Promise.resolve(0),
    ]);

    res.status(200).json({
      success: true,
      totalApplications,
      pendingApplications,
      shortlistedApplications,
      totalJobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get application statistics for a job
 * GET /api/applications/stats/:jobId
 */
const getApplicationStats = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    // Check if job exists and belongs to recruiter
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    if (job.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view stats for this job',
      });
    }

    const stats = await Application.aggregate([
      { $match: { jobId: require('mongoose').Types.ObjectId(jobId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Application.countDocuments({ jobId });

    res.status(200).json({
      success: true,
      total,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  getJobApplications,
  analyzeApplicationResume,
  getApplicationAnalysis,
  updateApplicationStatus,
  getMyApplicationStats,
  getApplicationStats,
};
