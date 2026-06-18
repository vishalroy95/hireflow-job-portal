const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  createTestimonial,
  getPublicTestimonials,
} = require('../controllers/testimonialController');

router.get('/', getPublicTestimonials);
router.post('/', verifyToken, createTestimonial);

module.exports = router;
