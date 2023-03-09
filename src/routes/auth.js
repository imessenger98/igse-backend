const express = require('express');

const router = express.Router();
const controllers = require('../controllers');

router.post('/sign-up', controllers.authentication.signUp);
router.post('/sign-in', controllers.authentication.login);
router.post('/verify-user', controllers.authentication.verifyRefreshToken);
router.post('/change-password', controllers.authentication.changePassword);
router.get('/get-user-profile', controllers.authentication.GetUserProfile);
module.exports = router;
