const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  createSupportTicket,
  getMySupportTickets,
} = require('../controllers/supportController');

router.post('/tickets', createSupportTicket);
router.get('/tickets/my', verifyToken, getMySupportTickets);

module.exports = router;
