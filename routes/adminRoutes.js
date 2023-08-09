const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/login', adminController.loginUser);
router.post('/verify-otp', adminController.verifyOTP);
router.get('/police-stations/:adminID',adminController.getPoliceStations);
router.post('/add-user/:adminId', adminController.addUserByAdmin);
router.patch('/update-user/:adminId/:badgeID', adminController.updateUserByAdmin);
router.delete('/delete-user/:adminId/:badgeID', adminController.deleteUser);
router.delete('/delete-session/:adminId/:sessionID', adminController.deleteSessionByAdmin);
router.post('/add-session/:adminId', adminController.addSessionByAdmin);
router.get('/:adminId/sessions', adminController.getSessionsByAdmin);
router.post('/assign-session/:adminId', adminController.assignUsersToSession);
router.get('/sos/:adminId', adminController.getAllIssues);
router.patch('/resolve-sos/:adminId/:badgeID/:issueID', adminController.resolveIssue);
router.post('/notif/:adminId', adminController.addUserNotification);
router.get('/surveillance/:adminId', adminController.getUpcomingSessionsForSurviellance);
router.get('/get-sessions/:adminId', adminController.getAllSessions)
router.get('/get-users/:adminId', adminController.getUsersUnderAdmin);
router.get('/statistics/:adminId', adminController.getStats);
router.get('/get-nearest-user/:adminId/:badgeID', adminController.getNearestUser);
    // router.post('/create-admin', adminController.createAdmin);
module.exports = router;
