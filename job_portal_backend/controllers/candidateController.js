const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const Application = require('../models/Application');
const CandidateProfile = require('../models/CandidateProfile');
const Job = require('../models/Job');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const User = require('../models/User');
const { notifyCandidateAboutMatchingJobs } = require('../utils/jobNotifications');
const { logEvent } = require('../utils/systemLogger');

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
};

const publicUploadPath = (file) => {
  const folder = file.fieldname === 'profileImage' ? 'profile-images' : 'resumes';
  return `/uploads/${folder}/${path.basename(file.filename)}`;
};

const persistentResumePath = (file) => {
  const content = fs.readFileSync(file.path);
  return `data:${file.mimetype};base64,${content.toString('base64')}`;
};

const getOrCreateProfile = async (userId) => {
  return CandidateProfile.findOneAndUpdate(
    { userId },
    { userId },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const calculateProfileCompletion = (user, profile) => {
  const checks = [
    user?.name,
    user?.email,
    profile?.phone || user?.contact?.phone,
    (user?.skills || []).length,
    profile?.education?.length,
    profile?.experience?.length,
    profile?.resume || user?.resume,
    profile?.portfolioUrl || user?.contact?.portfolio,
    profile?.linkedinUrl || user?.contact?.linkedin,
    profile?.githubUrl || user?.contact?.github,
    profile?.location,
    profile?.profileImage || user?.profileImage,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const skillMatchForJob = (candidateSkills, job) => {
  const skills = candidateSkills.map((skill) => skill.toLowerCase());
  const required = (job.skillsRequired || []).map((skill) => skill.toLowerCase());
  const matched = required.filter((skill) => skills.includes(skill));
  return required.length ? Math.round((matched.length / required.length) * 100) : 0;
};

const attachResumeAnalyses = async (applications) => {
  const rows = Array.isArray(applications) ? applications : [];
  if (!rows.length) return rows;

  const analyses = await ResumeAnalysis.find({
    applicationId: { $in: rows.map((application) => application._id) },
  }).lean();
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

const getDashboard = async (req, res, next) => {
  try {
    const [user, profile] = await Promise.all([
      User.findById(req.userId),
      getOrCreateProfile(req.userId),
    ]);

    const [applications, interviewInvites, unreadNotifications, savedJobs] = await Promise.all([
      Application.find({ userId: req.userId })
        .populate('jobId', 'title company location salary jobType workplaceType skillsRequired')
        .sort({ createdAt: -1 }),
      Notification.countDocuments({ userId: req.userId, type: 'interview', readAt: null }),
      Notification.countDocuments({ userId: req.userId, readAt: null }),
      Job.find({ _id: { $in: profile.savedJobs } }).limit(6),
    ]);

    const [recommendedJobs, applicationsWithAnalysis] = await Promise.all([
      findRecommendedJobs(user, profile, applications),
      attachResumeAnalyses(applications),
    ]);

    res.status(200).json({
      success: true,
      user,
      profile,
      stats: {
        appliedJobs: applications.length,
        savedJobs: profile.savedJobs.length,
        interviewInvites,
        unreadNotifications,
        profileCompletion: calculateProfileCompletion(user, profile),
      },
      applications: applicationsWithAnalysis,
      savedJobs,
      recommendedJobs,
      recentlyViewedJobs: profile.recentlyViewedJobs,
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const [user, profile] = await Promise.all([
      User.findById(req.userId).select('-password'),
      getOrCreateProfile(req.userId),
    ]);

    res.status(200).json({
      success: true,
      user,
      profile,
      profileCompletion: calculateProfileCompletion(user, profile),
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      headline,
      phone,
      skills,
      education,
      experience,
      resume,
      portfolioUrl,
      linkedinUrl,
      githubUrl,
      location,
      profileImage,
      privacy,
      bio,
    } = req.body;

    const normalizedSkills = toArray(skills);
    const userUpdate = {
      name,
      skills: normalizedSkills,
      bio,
      contact: {
        phone,
        portfolio: portfolioUrl,
        linkedin: linkedinUrl,
        github: githubUrl,
      },
    };
    const profileUpdate = {
      userId: req.userId,
      phone,
      location,
      portfolioUrl,
      linkedinUrl,
      githubUrl,
      'resumeParsed.headline': headline,
      education: Array.isArray(education) ? education : [],
      experience: Array.isArray(experience) ? experience : [],
    };

    if (privacy && typeof privacy === 'object') {
      profileUpdate.privacy = {
        visibleToRecruiters: privacy.visibleToRecruiters !== false,
        showContactInfo: privacy.showContactInfo !== false,
        jobAlerts: privacy.jobAlerts !== false,
      };
    }

    if (resume !== undefined) {
      userUpdate.resume = resume;
      profileUpdate.resume = resume;
    }

    if (profileImage !== undefined) {
      userUpdate.profileImage = profileImage;
      profileUpdate.profileImage = profileImage;
    }

    const [user, profile] = await Promise.all([
      User.findByIdAndUpdate(
        req.userId,
        userUpdate,
        { new: true, runValidators: true }
      ).select('-password'),
      CandidateProfile.findOneAndUpdate(
        { userId: req.userId },
        profileUpdate,
        { new: true, upsert: true, runValidators: true }
      ),
    ]);
    await notifyCandidateAboutMatchingJobs(user, profile);

    await logEvent({
      req,
      actor: user,
      action: 'candidate.profile_updated',
      category: 'candidate',
      message: 'Candidate updated profile settings',
      metadata: {
        profileId: profile._id.toString(),
        hasResume: Boolean(profile.resume || user.resume),
        privacy: profile.privacy,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Candidate profile updated',
      user,
      profile,
      profileCompletion: calculateProfileCompletion(user, profile),
    });
  } catch (error) {
    next(error);
  }
};

const uploadCandidateFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = req.file.fieldname === 'resume'
      ? persistentResumePath(req.file)
      : publicUploadPath(req.file);
    const resumeFile = {
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date(),
    };
    const update = req.file.fieldname === 'resume'
      ? { resume: filePath, resumeFile, 'resumeParsed.lastParsedAt': new Date() }
      : { profileImage: filePath };

    const profile = await CandidateProfile.findOneAndUpdate(
      { userId: req.userId },
      { userId: req.userId, ...update },
      { new: true, upsert: true }
    );

    const userUpdate = req.file.fieldname === 'resume' ? { resume: filePath } : { profileImage: filePath };
    await User.findByIdAndUpdate(req.userId, userUpdate);

    await logEvent({
      req,
      action: req.file.fieldname === 'resume' ? 'candidate.resume_uploaded' : 'candidate.profile_image_uploaded',
      category: 'candidate',
      message: req.file.fieldname === 'resume' ? 'Candidate uploaded resume' : 'Candidate uploaded profile image',
      metadata: {
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      },
    });

    res.status(200).json({ success: true, filePath, resumeFile: req.file.fieldname === 'resume' ? resumeFile : undefined, profile });
  } catch (error) {
    next(error);
  }
};

const parseResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    const profile = await getOrCreateProfile(req.userId);
    const skills = user.skills || [];

    profile.resumeParsed = {
      headline: skills.length ? `${skills.slice(0, 3).join(', ')} candidate` : 'Candidate profile',
      skills,
      experienceYears: profile.experience.length,
      lastParsedAt: new Date(),
    };
    await profile.save();

    res.status(200).json({ success: true, message: 'Resume parsed', profile });
  } catch (error) {
    next(error);
  }
};

const saveJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const profile = await getOrCreateProfile(req.userId);
    const alreadySaved = profile.savedJobs.some((id) => id.toString() === req.params.jobId);

    if (alreadySaved) {
      profile.savedJobs = profile.savedJobs.filter((id) => id.toString() !== req.params.jobId);
    } else {
      profile.savedJobs.push(req.params.jobId);
    }

    await profile.save();
    res.status(200).json({
      success: true,
      saved: !alreadySaved,
      savedJobs: profile.savedJobs,
    });
  } catch (error) {
    next(error);
  }
};

const getSavedJobs = async (req, res, next) => {
  try {
    const profile = await getOrCreateProfile(req.userId);
    await profile.populate('savedJobs');
    res.status(200).json({ success: true, jobs: profile.savedJobs });
  } catch (error) {
    next(error);
  }
};

const markViewedJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const profile = await getOrCreateProfile(req.userId);
    profile.recentlyViewedJobs = [
      { jobId: job._id, viewedAt: new Date() },
      ...profile.recentlyViewedJobs.filter((item) => item.jobId?.toString() !== job._id.toString()),
    ].slice(0, 20);
    await profile.save();

    res.status(200).json({ success: true, recentlyViewedJobs: profile.recentlyViewedJobs });
  } catch (error) {
    next(error);
  }
};

const findRecommendedJobs = async (user, profile, applications = []) => {
  const appliedJobIds = applications.map((application) => application.jobId?._id || application.jobId);
  const skills = user?.skills || profile?.resumeParsed?.skills || [];
  const filter = { active: true, _id: { $nin: appliedJobIds } };

  if (skills.length) {
    filter.skillsRequired = { $in: skills.map((skill) => new RegExp(skill, 'i')) };
  }

  const jobs = await Job.find(filter).sort({ featured: -1, createdAt: -1 }).limit(10);
  return jobs.map((job) => ({
    ...job.toObject(),
    skillMatch: skillMatchForJob(skills, job),
  }));
};

const getRecommendedJobs = async (req, res, next) => {
  try {
    const [user, profile, applications] = await Promise.all([
      User.findById(req.userId),
      getOrCreateProfile(req.userId),
      Application.find({ userId: req.userId }).select('jobId'),
    ]);

    const jobs = await findRecommendedJobs(user, profile, applications);
    res.status(200).json({ success: true, jobs });
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50);
    const messages = await Message.find({ receiverId: req.userId })
      .populate('senderId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, notifications, messages });
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { readAt: new Date() },
      { new: true }
    );

    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId).select('+password');
    const isValid = await user.matchPassword(currentPassword);

    if (!isValid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    await Promise.all([
      CandidateProfile.findOneAndDelete({ userId: req.userId }),
      Application.deleteMany({ userId: req.userId }),
      Notification.deleteMany({ userId: req.userId }),
      Message.deleteMany({ $or: [{ senderId: req.userId }, { receiverId: req.userId }] }),
      User.findByIdAndDelete(req.userId),
    ]);

    res.clearCookie('token');
    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  uploadCandidateFile,
  parseResume,
  saveJob,
  getSavedJobs,
  markViewedJob,
  getRecommendedJobs,
  getNotifications,
  markNotificationRead,
  changePassword,
  deleteAccount,
};
