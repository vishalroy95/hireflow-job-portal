const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { isRecruiter } = require('../middleware/roleCheck');
const upload = require('../middleware/upload');
const {
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
} = require('../controllers/recruiterController');
const {
  getPaymentPlans,
  createPaymentOrder,
  verifyPayment,
  getMyPayments,
} = require('../controllers/paymentController');

router.use(verifyToken, isRecruiter);

router.get('/dashboard', getRecruiterHome);
router.get('/company', getCompany);
router.put('/company', upsertCompany);
router.post('/company/logo', upload.single('companyLogo'), uploadCompanyLogo);

router.post('/jobs', createRecruiterJob);
router.put('/jobs/:id', updateRecruiterJob);
router.post('/jobs/:id/duplicate', duplicateJob);
router.put('/jobs/:id/status', updateJobStatus);

router.get('/applicants', getApplicants);
router.post('/applicants/:id/profile-view', recordCandidateProfileView);
router.put('/applicants/:id/status', updateApplicantStatus);
router.post('/applicants/:id/screen', screenApplicant);

router.get('/interviews', getInterviews);
router.post('/interviews', scheduleInterview);
router.put('/interviews/:id', updateInterview);

router.get('/messages', getMessages);
router.post('/messages', sendMessage);

router.get('/analytics', getAnalytics);
router.get('/subscription', getSubscription);
router.get('/billing/plans', getPaymentPlans);
router.get('/billing/payments', getMyPayments);
router.post('/billing/orders', createPaymentOrder);
router.post('/billing/verify', verifyPayment);

module.exports = router;
