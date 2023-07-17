const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.get('/:badgeID', profileController.getProfileOfUserByBadgeID);
module.exports = router;