const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { isCandidate } = require('../middleware/roleCheck');
const upload = require('../middleware/upload');
const {
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
} = require('../controllers/candidateController');

router.use(verifyToken, isCandidate);

router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/resume', upload.single('resume'), uploadCandidateFile);
router.post('/profile/image', upload.single('profileImage'), uploadCandidateFile);
router.post('/profile/parse-resume', parseResume);

router.get('/saved-jobs', getSavedJobs);
router.put('/saved-jobs/:jobId', saveJob);
router.post('/viewed-jobs/:jobId', markViewedJob);
router.get('/recommended-jobs', getRecommendedJobs);

router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

router.put('/settings/password', changePassword);
router.delete('/settings/account', deleteAccount);

module.exports = router;
