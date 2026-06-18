// routes/authRoutes.js
// Authentication routes

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  register,
  verifyRegistration,
  completeGoogleRecruiterRegistration,
  login,
  startGoogleAuth,
  handleGoogleCallback,
  logout,
  profile,
  updateProfile,
  verifyEmail,
  forgotPassword,
  resetPasswordWithOtp,
  resetPassword,
} = require('../controllers/authController');

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { name, email, password, role }
 */
router.post('/register', register);
router.post('/register/verify', verifyRegistration);
router.post('/register/google-recruiter', completeGoogleRecruiterRegistration);

/**
 * POST /api/auth/login
 * Login user
 * Body: { email, password }
 */
router.post('/login', login);

router.get('/google', startGoogleAuth);
router.get('/google/callback', handleGoogleCallback);

router.post('/forgot-password', forgotPassword);
router.put('/reset-password/otp', resetPasswordWithOtp);
router.put('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);

/**
 * GET /api/auth/logout
 * Logout user - requires authentication
 */
router.get('/logout', verifyToken, logout);

/**
 * GET /api/auth/profile
 * Get current user profile - requires authentication
 */
router.get('/profile', verifyToken, profile);

/**
 * PUT /api/auth/profile
 * Update user profile - requires authentication
 * Body: { name, bio, skills, contact }
 */
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
