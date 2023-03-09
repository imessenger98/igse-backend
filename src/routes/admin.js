const express = require('express');

const router = express.Router();
const controllers = require('../controllers');
const common = require('../middleware');

router.get('/get-cost-control', common.verifyAccessToken, controllers.admin.getCostControl);
router.put('/update-cost-control', common.verifyAccessToken, controllers.admin.UpdateCostControl);
router.post('/add-evc-code', common.verifyAccessToken, controllers.admin.AddEVCCode);
router.get('/list-evc-code', common.verifyAccessToken, controllers.admin.getEVCCode);
router.get('/list-user', common.verifyAccessToken, controllers.admin.getUserList);
router.post('/user-control', common.verifyAccessToken, controllers.admin.userLimit);
router.get('/list-bills', common.verifyAccessToken, controllers.admin.getBillList);
router.put('/update-payment-status', common.verifyAccessToken, controllers.admin.payViaAdmin);
router.get('/statistics', common.verifyAccessToken, controllers.admin.getStatistics);
module.exports = router;
