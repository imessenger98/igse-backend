const express = require('express');

const router = express.Router();
const authRouter = require('./auth');
const adminRouter = require('./admin');
const userRoute = require('./user');

router.use('/auth', authRouter);
router.use('/admin', adminRouter);
router.use('/user', userRoute);
module.exports = router;
