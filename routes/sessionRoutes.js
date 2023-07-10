const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

router.get('/:badgeID/previous-sessions', sessionController.getPreviousSessionsAttendance);

module.exports = router;