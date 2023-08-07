const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/login', userController.loginUser);
router.post('/verify-otp', userController.verifyOTP);
router.get('/:badgeID', userController.getUserByBadgeID);
router.get('/:badgeID/current-session', userController.getCurrentSession);
router.post('/:badgeID/issues', userController.createIssue)
router.get('/:badgeID/previous-sessions', userController.getPreviousSessionsAttendance);
router.get('/:badgeID/upcoming-sessions', userController.getUpcomingSession)
router.get('/profile/:badgeID', userController.getProfileOfUserByBadgeID);
router.get('/notifications/:badgeID', userController.getUserNotifications);
router.patch('/notifications/:badgeID/:notificationID', userController.markNotificatonsReaded);
router.post('/checkIn/:badgeID/:sessionID', userController.checkInCheckpoint);
router.get('/createPdf/:badgeID', userController.createpdf);
router.post('/start-duty/:badgeID', userController.startDutyFromNFC);
router.post('/end-duty/:badgeId', userController.endDuty);

module.exports = router;