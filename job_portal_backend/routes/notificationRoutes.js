const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getMyNotifications,
  markAllMyNotificationsRead,
  markMyNotificationRead,
} = require('../controllers/notificationController');

router.get('/', verifyToken, getMyNotifications);
router.put('/read-all', verifyToken, markAllMyNotificationsRead);
router.put('/:id/read', verifyToken, markMyNotificationRead);

module.exports = router;
