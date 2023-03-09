const express = require('express');

const router = express.Router();
const controllers = require('../controllers');
const common = require('../middleware');

router.post('/add-usage', common.verifyAccessTokenUser, controllers.user.addUsage);
router.get('/list-bill-payment', common.verifyAccessTokenUser, controllers.user.listBillPayment);
router.post('/pay-due', common.verifyAccessTokenUser, controllers.user.payDue);
router.post('/recharge', common.verifyAccessTokenUser, controllers.user.recharge);
router.get('/list-recharge', common.verifyAccessTokenUser, controllers.user.listRecharge);

module.exports = router;
