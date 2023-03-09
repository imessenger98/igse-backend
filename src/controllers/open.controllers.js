/* eslint-disable quote-props */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-return-await */
/* eslint-disable consistent-return */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-unused-vars */
/* eslint-disable no-restricted-syntax */
const logger = require('../logger/logger');
const models = require('../models');
const common = require('./common');

const propertyCounts = async (req, res, next) => {
  try {
    const propertyTypes = await models.User.distinct('propertyType');
    const propertyCount = [];
    for (const propertyType of propertyTypes) {
      const count = await models.User.countDocuments({ propertyType });
      propertyCount.push({ [propertyType.toLowerCase()]: count.toString() });
    }
    res.json(propertyCount);
  } catch (error) {
    logger.error(error);
    res.status(500).send('Error getting property count');
  }
};

const averageCalculation = async (req, res, next) => {
  try {
    const { propertyType, bedrooms } = req.params;
    if (!propertyType) {
      common.throwErrorMessage('Fields cannot be empty', 400);
    }
    models.User.find({
      propertyType,
      bedRooms: bedrooms,
    })
      .then(async (users) => {
        if (!users) {
          common.throwErrorMessage('Users not found', 400);
        }
        const billsPromises = users.map(async (user) => await models.Bill.find({
          user: user._id,
          paid: 'Not Paid',
        }));
        const bills = await Promise.all(billsPromises);
        const flatBill = bills.flat();
        let sumElectricity = 0;
        let sumGas = 0;
        for (const collection of flatBill) {
          sumElectricity += collection.averageElectricityPerDay;
          sumGas += collection.averageGasPerDay;
        }
        const result = {
          'type': propertyType.toLowerCase(),
          'bedroom': bedrooms,
          'average_electricity_gas_cost_per_day': sumElectricity + sumGas,
          'unit': 'pound',
        };
        res.json(result);
      });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};
module.exports = {
  propertyCounts,
  averageCalculation,
};
