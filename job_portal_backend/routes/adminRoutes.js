const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const {
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
} = require('../controllers/adminController');
const {
  getSettings,
  updateSettingsSection,
  uploadBrandingAsset,
  uploadLogo,
  uploadBanner,
} = require('../controllers/settingsController');
const {
  deleteAdminTestimonial,
  getAdminTestimonials,
  setAdminTestimonialStatus,
  updateAdminTestimonial,
} = require('../controllers/testimonialController');
const {
  deleteAdminSupportTicket,
  getAdminSupportTickets,
  replyToSupportTicket,
  updateAdminSupportTicket,
} = require('../controllers/supportController');
const { getSystemLogs } = require('../controllers/logController');
const {
  getAdminPayments,
  getAdminPaymentPlans,
  updateAdminPaymentPlans,
} = require('../controllers/paymentController');

router.use(verifyToken, requireAdmin);

router.get('/dashboard/stats', getDashboardStats);

router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/:action(block|unblock)', setUserBlocked);

router.get('/recruiters', getRecruiters);
router.get('/recruiters/:id', getUserById);
router.put('/recruiters/:id/:action(approve|reject)', setRecruiterStatus);
router.put('/recruiters/:id', updateUser);

router.get('/jobs', getJobs);
router.get('/jobs/:id', getJobById);
router.delete('/jobs/:id', deleteJob);
router.put('/jobs/:id/:action(activate|deactivate)', setJobActive);

router.get('/applications', getApplications);
router.get('/applications/stats', getDashboardStats);

router.get('/testimonials', getAdminTestimonials);
router.put('/testimonials/:id', updateAdminTestimonial);
router.delete('/testimonials/:id', deleteAdminTestimonial);
router.put('/testimonials/:id/:action(approve|reject|pending)', setAdminTestimonialStatus);

router.get('/support/tickets', getAdminSupportTickets);
router.put('/support/tickets/:id', updateAdminSupportTicket);
router.post('/support/tickets/:id/reply', replyToSupportTicket);
router.delete('/support/tickets/:id', deleteAdminSupportTicket);

router.get('/analytics/stats', getDashboardStats);
router.get('/analytics/data', getAnalytics);

router.get('/logs', getSystemLogs);
router.get('/payments', getAdminPayments);
router.get('/payment-plans', getAdminPaymentPlans);
router.put('/payment-plans', updateAdminPaymentPlans);

router.get('/settings', getSettings);
router.put('/settings/:section(general|branding|email|currency|ai|payments)', updateSettingsSection);
router.post('/settings/logo', uploadBrandingAsset.single('file'), uploadLogo);
router.post('/settings/banner', uploadBrandingAsset.single('file'), uploadBanner);

module.exports = router;
