// controllers/jobController.js
// Job controller - CRUD operations for jobs

const Job = require('../models/Job');
const Company = require('../models/Company');
const User = require('../models/User');
const { notifyCandidatesAboutNewJob } = require('../utils/jobNotifications');

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Create new job posting
 * POST /api/jobs
 * Only recruiters can create jobs
 */
const createJob = async (req, res, next) => {
  try {
    const {
      title,
      company,
      location,
      salary,
      description,
      skillsRequired,
      jobType,
      experience,
    } = req.body;

    // Validation
    if (
      !title ||
      !company ||
      !location ||
      !salary ||
      !description ||
      !skillsRequired
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Create job
    const job = await Job.create({
      title,
      company,
      location,
      salary,
      description,
      skillsRequired,
      jobType: jobType || 'Full-time',
      experience: experience || 'Entry Level',
      createdBy: req.userId,
    });

    await notifyCandidatesAboutNewJob(job);

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all job listings (with filters)
 * GET /api/jobs
 */
const getAllJobs = async (req, res, next) => {
  try {
    const { title, location, company, minSalary, maxSalary, jobType, experience, skills, workplaceType, sort = 'latest' } = req.query;

    // Build filter object
    const filter = { active: true, status: 'active', adminDisabled: { $ne: true } };

    if (title) {
      const keyword = new RegExp(escapeRegExp(title), 'i');
      filter.$or = [
        { title: keyword },
        { company: keyword },
        { description: keyword },
        { skillsRequired: keyword },
      ];
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (company) {
      filter.company = { $regex: company, $options: 'i' };
    }

    if (minSalary || maxSalary) {
      filter['salary.min'] = filter['salary.min'] || {};
      if (minSalary) filter['salary.min']['$gte'] = Number(minSalary);
      if (maxSalary) filter['salary.max'] = filter['salary.max'] || {};
      if (maxSalary) filter['salary.max']['$lte'] = Number(maxSalary);
    }

    if (jobType) {
      filter.jobType = jobType;
    }

    if (experience) {
      filter.experience = experience;
    }

    if (workplaceType) {
      filter.workplaceType = workplaceType;
    }

    if (skills) {
      filter.skillsRequired = {
        $in: String(skills)
          .split(',')
          .map((skill) => new RegExp(skill.trim(), 'i')),
      };
    }

    // Pagination
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 48);
    const skip = (page - 1) * limit;
    const sortMap = {
      latest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      salaryHigh: { 'salary.max': -1, createdAt: -1 },
      salaryLow: { 'salary.min': 1, createdAt: -1 },
    };
    const sortOption = sortMap[sort] || sortMap.latest;

    // Get jobs
    const jobs = await Job.find(filter)
      .populate('createdBy', 'name email company')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Job.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
      sort,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get public homepage marketplace stats
 * GET /api/jobs/stats
 */
const getPublicJobStats = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [openings, activeJobs, companies, candidates, newJobs] = await Promise.all([
      Job.aggregate([
        { $match: { active: true, status: 'active' } },
        { $group: { _id: null, total: { $sum: '$openingsCount' } } },
      ]),
      Job.countDocuments({ active: true, status: 'active' }),
      Company.countDocuments({}),
      User.countDocuments({ role: 'candidate', isBlocked: { $ne: true } }),
      Job.countDocuments({ active: true, status: 'active', createdAt: { $gte: sevenDaysAgo } }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        liveJobs: openings[0]?.total || activeJobs,
        companies,
        candidates,
        newJobs,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get popular job categories from active job skills
 * GET /api/jobs/categories
 */
const getPopularCategories = async (req, res, next) => {
  try {
    const categories = await Job.aggregate([
      { $match: { active: true } },
      { $unwind: '$skillsRequired' },
      {
        $group: {
          _id: { $toLower: '$skillsRequired' },
          label: { $first: '$skillsRequired' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, label: 1 } },
      { $limit: 8 },
      {
        $project: {
          _id: 0,
          label: 1,
          count: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get public employers from active job postings
 * GET /api/jobs/employers
 */
const getEmployers = async (req, res, next) => {
  try {
    const { search, location, category, organizationType, sort = 'openJobs' } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 48);
    const skip = (page - 1) * limit;

    const match = { active: true, status: 'active', adminDisabled: { $ne: true } };

    if (search) {
      const keyword = new RegExp(escapeRegExp(search), 'i');
      match.$or = [
        { company: keyword },
        { title: keyword },
        { skillsRequired: keyword },
      ];
    }

    if (location) {
      match.location = { $regex: escapeRegExp(location), $options: 'i' };
    }

    if (category) {
      match.skillsRequired = {
        $in: String(category)
          .split(',')
          .map((skill) => new RegExp(escapeRegExp(skill.trim()), 'i')),
      };
    }

    const companyProfileMatch = {};
    if (organizationType) {
      companyProfileMatch.$or = [
        { 'companyProfile.industryType': { $regex: escapeRegExp(organizationType), $options: 'i' } },
        { 'companyProfile.companySize': { $regex: escapeRegExp(organizationType), $options: 'i' } },
      ];
    }

    const sortMap = {
      latest: { latestJobDate: -1, openJobs: -1, name: 1 },
      name: { name: 1 },
      openJobs: { openJobs: -1, name: 1 },
    };
    const sortOption = sortMap[sort] || sortMap.openJobs;

    const groupedEmployers = await Job.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { $toLower: '$company' },
          name: { $first: '$company' },
          openJobs: { $sum: 1 },
          totalOpenings: { $sum: '$openingsCount' },
          locations: { $addToSet: '$location' },
          skills: { $addToSet: '$skillsRequired' },
          latestJobDate: { $max: '$createdAt' },
          latestJob: {
            $first: {
              _id: '$_id',
              title: '$title',
              location: '$location',
              jobType: '$jobType',
              workplaceType: '$workplaceType',
              createdAt: '$createdAt',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'companies',
          let: { companyName: '$_id' },
          pipeline: [
            { $addFields: { normalizedName: { $toLower: '$name' } } },
            { $match: { $expr: { $eq: ['$normalizedName', '$$companyName'] } } },
            { $limit: 1 },
          ],
          as: 'companyProfile',
        },
      },
      { $unwind: { path: '$companyProfile', preserveNullAndEmptyArrays: true } },
      ...(Object.keys(companyProfileMatch).length ? [{ $match: companyProfileMatch }] : []),
      { $sort: sortOption },
      {
        $facet: {
          employers: [{ $skip: skip }, { $limit: limit }],
          meta: [{ $count: 'total' }],
        },
      },
    ]);

    const employers = groupedEmployers[0]?.employers || [];
    const total = groupedEmployers[0]?.meta?.[0]?.total || 0;

    const normalizedEmployers = employers.map((employer) => {
      const company = employer.companyProfile;
      const skills = [...new Set((employer.skills || []).flat().filter(Boolean))].slice(0, 5);

      return {
        _id: employer._id,
        name: employer.name,
        openJobs: employer.openJobs,
        totalOpenings: employer.totalOpenings,
        locations: employer.locations,
        latestJob: employer.latestJob,
        companyId: company?._id,
        logo: company?.logo || '',
        website: company?.website || '',
        industryType: company?.industryType || '',
        companySize: company?.companySize || '',
        description: company?.description || '',
        verificationStatus: company?.verificationStatus || 'unverified',
        skills,
      };
    });

    res.status(200).json({
      success: true,
      count: normalizedEmployers.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
      sort,
      employers: normalizedEmployers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get featured job listings
 * GET /api/jobs/featured
 */
const getFeaturedJobs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;
    const jobs = await Job.find({ active: true })
      .sort({ featured: -1, createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recommended jobs for a job details page
 * GET /api/jobs/:id/recommended
 */
const getRecommendedJobs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 3;
    const currentJob = await Job.findById(req.params.id);

    if (!currentJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    const skills = currentJob.skillsRequired || [];
    const relatedFilter = {
      _id: { $ne: currentJob._id },
      active: true,
      $or: [
        skills.length ? { skillsRequired: { $in: skills.map((skill) => new RegExp(escapeRegExp(skill), 'i')) } } : null,
        currentJob.location ? { location: { $regex: currentJob.location, $options: 'i' } } : null,
        currentJob.company ? { company: { $regex: currentJob.company, $options: 'i' } } : null,
        currentJob.jobType ? { jobType: currentJob.jobType } : null,
        currentJob.experience ? { experience: currentJob.experience } : null,
        currentJob.workplaceType ? { workplaceType: currentJob.workplaceType } : null,
      ].filter(Boolean),
    };

    const relatedJobs = await Job.find(relatedFilter)
      .sort({ featured: -1, createdAt: -1 })
      .limit(Math.max(limit * 3, limit));

    const normalizedSkills = skills.map((skill) => String(skill).toLowerCase());
    const scoredJobs = relatedJobs
      .map((job) => {
        const matchingSkills = (job.skillsRequired || []).filter((skill) =>
          normalizedSkills.includes(String(skill).toLowerCase())
        ).length;

        const score =
          matchingSkills * 5 +
          (job.company === currentJob.company ? 3 : 0) +
          (job.location === currentJob.location ? 2 : 0) +
          (job.jobType === currentJob.jobType ? 2 : 0) +
          (job.workplaceType === currentJob.workplaceType ? 2 : 0) +
          (job.experience === currentJob.experience ? 1 : 0) +
          (job.featured ? 1 : 0);

        return { job, score };
      })
      .sort((a, b) => b.score - a.score || b.job.createdAt - a.job.createdAt)
      .map(({ job }) => job)
      .slice(0, limit);

    let jobs = scoredJobs;

    if (jobs.length < limit) {
      const existingIds = jobs.map((job) => job._id);
      const fallbackJobs = await Job.find({
        _id: { $nin: [currentJob._id, ...existingIds] },
        active: true,
      })
        .sort({ featured: -1, createdAt: -1 })
        .limit(limit - jobs.length);

      jobs = [...jobs, ...fallbackJobs];
    }

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single job by ID
 * GET /api/jobs/:id
 */
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('createdBy', 'name email company')
      .populate('applicants');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    const companyProfile = await Company.findOne({
      name: { $regex: `^${escapeRegExp(job.company)}$`, $options: 'i' },
    });

    res.status(200).json({
      success: true,
      job: {
        ...job.toObject(),
        companyProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update job details
 * PUT /api/jobs/:id
 * Only recruiter who created job can update
 */
const updateJob = async (req, res, next) => {
  try {
    const { title, description, location, salary, skillsRequired, jobType, experience, active } = req.body;

    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if user is job creator
    if (job.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job',
      });
    }

    // Update fields
    if (title) job.title = title;
    if (description) job.description = description;
    if (location) job.location = location;
    if (salary) job.salary = salary;
    if (skillsRequired) job.skillsRequired = skillsRequired;
    if (jobType) job.jobType = jobType;
    if (experience) job.experience = experience;
    if (active !== undefined) job.active = active;

    job = await job.save();

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete job posting
 * DELETE /api/jobs/:id
 * Only recruiter who created job can delete
 */
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if user is job creator
    if (job.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job',
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get jobs posted by current recruiter
 * GET /api/jobs/recruiter/my-jobs
 */
const getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ createdBy: req.userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJob,
  getAllJobs,
  getPublicJobStats,
  getFeaturedJobs,
  getEmployers,
  getPopularCategories,
  getRecommendedJobs,
  getJobById,
  updateJob,
  deleteJob,
  getMyJobs,
};
