const express = require('express');
const router = express.Router();
const { getPublicSettings } = require('../controllers/publicSettingsController');

router.get('/public', getPublicSettings);

module.exports = router;
