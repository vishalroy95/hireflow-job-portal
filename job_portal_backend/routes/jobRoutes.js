// routes/jobRoutes.js
// Job listing routes

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { isRecruiter } = require('../middleware/roleCheck');
const {
  createJob,
  getAllJobs,
  getPublicJobStats,
  getEmployers,
  getFeaturedJobs,
  getPopularCategories,
  getRecommendedJobs,
  getJobById,
  updateJob,
  deleteJob,
  getMyJobs,
} = require('../controllers/jobController');

/**
 * POST /api/jobs
 * Create a new job posting - only recruiters
 * Body: { title, company, location, salary, description, skillsRequired, jobType, experience }
 */
router.post('/', verifyToken, isRecruiter, createJob);

/**
 * GET /api/jobs
 * Get all active job listings with filters
 * Query params: title, location, company, minSalary, maxSalary, jobType, experience, page, limit
 */
router.get('/', getAllJobs);

router.get('/featured', getFeaturedJobs);
router.get('/stats', getPublicJobStats);
router.get('/categories', getPopularCategories);
router.get('/employers', getEmployers);

/**
 * GET /api/jobs/recruiter/my-jobs
 * Get jobs posted by current recruiter - only recruiters
 */
router.get('/recruiter/my-jobs', verifyToken, isRecruiter, getMyJobs);

/**
 * GET /api/jobs/:id/recommended
 * Get dynamic recommendations for the selected job
 */
router.get('/:id/recommended', getRecommendedJobs);

/**
 * GET /api/jobs/:id
 * Get single job by ID
 */
router.get('/:id', getJobById);

/**
 * PUT /api/jobs/:id
 * Update job details - only creator recruiter
 * Body: { title, description, location, salary, skillsRequired, jobType, experience, active }
 */
router.put('/:id', verifyToken, isRecruiter, updateJob);

/**
 * DELETE /api/jobs/:id
 * Delete job posting - only creator recruiter
 */
router.delete('/:id', verifyToken, isRecruiter, deleteJob);

module.exports = router;
