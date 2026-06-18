const Application = require('../models/Application');
const Company = require('../models/Company');
const Job = require('../models/Job');
const RecruiterProfile = require('../models/RecruiterProfile');
const User = require('../models/User');
const { logEvent } = require('../utils/systemLogger');

const getPagination = (req, defaultLimit = 10) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit, 10) || defaultLimit, 1);
  return { page, limit, skip: (page - 1) * limit };
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalRecruiters,
      totalCandidates,
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications,
      shortlistedApplications,
      approvedRecruiters,
      pendingRecruiters,
      blockedUsers,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'recruiter' }),
      User.countDocuments({ role: 'candidate' }),
      Job.countDocuments({}),
      Job.countDocuments({ active: true }),
      Application.countDocuments({}),
      Application.countDocuments({ status: 'pending' }),
      Application.countDocuments({ status: 'shortlisted' }),
      User.countDocuments({ role: 'recruiter', recruiterStatus: 'approved' }),
      User.countDocuments({ role: 'recruiter', recruiterStatus: 'pending' }),
      User.countDocuments({ isBlocked: true }),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalRecruiters,
        totalCandidates,
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications,
        shortlistedApplications,
        approvedRecruiters,
        pendingRecruiters,
        blockedUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { search, role } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      users,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const allowed = ['name', 'email', 'role', 'bio', 'skills', 'contact', 'isBlocked', 'recruiterStatus'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logEvent({
      req,
      action: 'admin.user_updated',
      category: 'admin',
      message: `Admin updated user: ${user.email}`,
      metadata: {
        targetUserId: user._id.toString(),
        targetEmail: user.email,
        fields: Object.keys(updates),
      },
    });

    res.json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await logEvent({
      req,
      action: 'admin.user_deleted',
      category: 'admin',
      severity: 'warning',
      message: `Admin deleted user: ${user.email}`,
      metadata: {
        targetUserId: user._id.toString(),
        targetEmail: user.email,
        targetRole: user.role,
      },
    });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const setUserBlocked = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: req.params.action === 'block' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logEvent({
      req,
      action: req.params.action === 'block' ? 'admin.user_blocked' : 'admin.user_unblocked',
      category: 'admin',
      severity: req.params.action === 'block' ? 'warning' : 'info',
      message: `Admin ${req.params.action === 'block' ? 'blocked' : 'unblocked'} user: ${user.email}`,
      metadata: {
        targetUserId: user._id.toString(),
        targetEmail: user.email,
      },
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const getRecruiters = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { search, status } = req.query;
    const filter = { role: 'recruiter' };

    if (status) filter.recruiterStatus = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    const userIds = users.map((user) => user._id);
    const [companies, profiles] = await Promise.all([
      Company.find({ recruiterId: { $in: userIds } }),
      RecruiterProfile.find({ userId: { $in: userIds } }),
    ]);

    const recruiters = users.map((user) => {
      const company = companies.find((item) => item.recruiterId.toString() === user._id.toString());
      const profile = profiles.find((item) => item.userId.toString() === user._id.toString());
      return {
        ...user.toObject(),
        company,
        recruiterProfile: profile,
      };
    });

    res.json({
      success: true,
      users: recruiters,
      recruiters,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    next(error);
  }
};

const setRecruiterStatus = async (req, res, next) => {
  try {
    const status = req.params.action === 'approve' ? 'approved' : 'rejected';
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'recruiter' },
      { recruiterStatus: status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Recruiter not found' });
    }

    await Promise.all([
      Company.findOneAndUpdate({ recruiterId: user._id }, { verificationStatus: status }),
      RecruiterProfile.findOneAndUpdate({ userId: user._id }, { verificationStatus: status }),
    ]);

    await logEvent({
      req,
      action: `admin.recruiter_${status}`,
      category: 'admin',
      message: `Admin ${status} recruiter: ${user.email}`,
      metadata: {
        recruiterId: user._id.toString(),
        recruiterEmail: user.email,
        status,
      },
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const getJobs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { search, active, jobType } = req.query;
    const filter = {};

    if (active !== undefined && active !== '') filter.active = active === 'true';
    if (jobType) filter.jobType = jobType;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('createdBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Job.countDocuments(filter),
    ]);

    res.json({ success: true, jobs, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    next(error);
  }
};

const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('createdBy', 'name email role');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    await logEvent({
      req,
      action: 'admin.job_deleted',
      category: 'admin',
      severity: 'warning',
      message: `Admin deleted job: ${job.title}`,
      metadata: {
        jobId: job._id.toString(),
        jobTitle: job.title,
        company: job.company,
      },
    });
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const setJobActive = async (req, res, next) => {
  try {
    const shouldActivate = req.params.action === 'activate';
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      {
        active: shouldActivate,
        adminDisabled: !shouldActivate,
        ...(shouldActivate ? { status: 'active' } : {}),
      },
      { new: true }
    );
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    await logEvent({
      req,
      action: shouldActivate ? 'admin.job_activated' : 'admin.job_deactivated',
      category: 'admin',
      message: `Admin ${shouldActivate ? 'activated' : 'deactivated'} job: ${job.title}`,
      metadata: {
        jobId: job._id.toString(),
        jobTitle: job.title,
        company: job.company,
      },
    });
    res.json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

const getApplications = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      const [matchingUsers, matchingJobs] = await Promise.all([
        User.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }).select('_id'),
        Job.find({
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } },
          ],
        }).select('_id'),
      ]);

      filter.$or = [
        { userId: { $in: matchingUsers.map((user) => user._id) } },
        { jobId: { $in: matchingJobs.map((job) => job._id) } },
      ];
    }

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('userId', 'name email')
        .populate('jobId', 'title company')
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit),
      Application.countDocuments(filter),
    ]);

    res.json({ success: true, applications, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const [
      applicationsByStatus,
      jobsByType,
      usersByRole,
      jobsByWorkplace,
      recruitersByStatus,
      jobsByStatus,
      totals,
    ] = await Promise.all([
      Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Job.aggregate([{ $group: { _id: '$jobType', count: { $sum: 1 } } }]),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Job.aggregate([{ $group: { _id: '$workplaceType', count: { $sum: 1 } } }]),
      User.aggregate([
        { $match: { role: 'recruiter' } },
        { $group: { _id: '$recruiterStatus', count: { $sum: 1 } } },
      ]),
      Job.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Promise.all([
        User.countDocuments({}),
        User.countDocuments({ role: 'candidate' }),
        User.countDocuments({ role: 'recruiter' }),
        Job.countDocuments({}),
        Job.countDocuments({ active: true }),
        Application.countDocuments({}),
      ]),
    ]);

    res.json({
      success: true,
      applicationsByStatus,
      jobsByType,
      usersByRole,
      jobsByWorkplace,
      recruitersByStatus,
      jobsByStatus,
      totals: {
        totalUsers: totals[0],
        totalCandidates: totals[1],
        totalRecruiters: totals[2],
        totalJobs: totals[3],
        activeJobs: totals[4],
        totalApplications: totals[5],
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  setUserBlocked,
  getRecruiters,
  setRecruiterStatus,
  getJobs,
  getJobById,
  deleteJob,
  setJobActive,
  getApplications,
  getAnalytics,
};
