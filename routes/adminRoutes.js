const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/login', adminController.loginUser);
router.post('/verify-otp', adminController.verifyOTP);
router.post('/add-user/:adminId',  adminController.addUserByAdmin);
router.post('/add-session/:adminId',  adminController.addSessionByAdmin);
router.post('/assign-session/:adminId',  adminController.assignUsersToSession);
router.get('/sos/:adminId',  adminController.getAllIssues);
module.exports = router;