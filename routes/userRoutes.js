const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/:badgeID', userController.getUserByBadgeID);
router.get('/:badgeID/current-session', userController.getCurrentSession);

module.exports = router;