const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

router.get('/:badgeID/upcoming-sessions', alertController.getUpcomingSession)
module.exports = router;