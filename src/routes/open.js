const express = require('express');

const router = express.Router();
const controllers = require('../controllers/open.controllers');

router.get('/propertycount', controllers.propertyCounts);
router.get('/:propertyType/:bedrooms', controllers.averageCalculation);
module.exports = router;
