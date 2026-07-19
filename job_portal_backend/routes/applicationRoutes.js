// routes/applicationRoutes.js
// Job application routes

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { isCandidate, isRecruiter } = require('../middleware/roleCheck');
const {
  applyForJob,
  getMyApplications,
  getJobApplications,
  analyzeApplicationResume,
  analyzeJobResumePreview,
  getApplicationAnalysis,
  updateApplicationStatus,
  getMyApplicationStats,
  getApplicationStats,
} = require('../controllers/applicationController');

/**
 * POST /api/applications/apply/:jobId
 * Apply for a job - only candidates
 * Body: { coverLetter }
 */
router.post('/apply/:jobId', verifyToken, isCandidate, applyForJob);

/**
 * GET /api/applications/my-applications
 * Get all applications submitted by current candidate
 */
router.get('/my-applications', verifyToken, isCandidate, getMyApplications);

/**
 * GET /api/applications/job/:jobId
 * Get all applications for a specific job - only recruiter who created job
 */
router.get('/job/:jobId', verifyToken, isRecruiter, getJobApplications);

/**
 * PUT /api/applications/status/:id
 * Update application status - only recruiter who created the job
 * Body: { status } - status must be: pending, accepted, rejected, shortlisted
 */
router.put('/status/:id', verifyToken, isRecruiter, updateApplicationStatus);

/**
 * POST /api/applications/jobs/:jobId/analyze-resume
 * Preview candidate resume/profile match before applying.
 */
router.post('/jobs/:jobId/analyze-resume', verifyToken, isCandidate, analyzeJobResumePreview);

/**
 * POST /api/applications/:id/analyze
 * Analyze candidate resume/profile against the job. Candidate owner, recruiter owner, or admin can run it.
 */
router.post('/:id/analyze', verifyToken, analyzeApplicationResume);

/**
 * GET /api/applications/:id/analysis
 * Get saved AI resume analysis for an application.
 */
router.get('/:id/analysis', verifyToken, getApplicationAnalysis);

/**
 * GET /api/applications/stats
 * Get current user's application statistics
 */
router.get('/stats', verifyToken, getMyApplicationStats);

/**
 * GET /api/applications/stats/:jobId
 * Get application statistics for a job - only recruiter who created job
 */
router.get('/stats/:jobId', verifyToken, isRecruiter, getApplicationStats);

module.exports = router;
