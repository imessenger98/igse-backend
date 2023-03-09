/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-undef */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-unused-vars */
/* eslint-disable no-restricted-globals */
const logger = require('../logger/logger');
const models = require('../models');
const common = require('./common');

const getCostControl = async (req, res, next) => {
  try {
    const charges = await models.Charges.findOne({ name: 'default' }).lean();
    const data = {
      electricity: charges.electricity,
      gas: charges.gas,
      standingCharge: charges.standingCharge,
    };
    res.json(data);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const UpdateCostControl = async (req, res, next) => {
  try {
    const {
      electricityDay, electricityNight, gas, standingCharge,
    } = req.body;

    if (!electricityDay || !electricityNight || !gas || !standingCharge) {
      common.throwErrorMessage('Missing required fields', 400);
    }
    // Check if the fields are numbers
    if (isNaN(electricityDay)
    || isNaN(electricityNight)
    || isNaN(gas)
    || isNaN(standingCharge)) {
      common.throwErrorMessage('Fields must be numbers', 400);
    }
    await models.Charges.findOneAndUpdate(
      { name: 'default' },
      {
        'electricity.day': Number(electricityDay),
        'electricity.night': Number(electricityNight),
        gas: Number(gas),
        standingCharge: Number(standingCharge),
      },
    );
    res.json({ message: 'Cost Control Updated Successfully' });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const AddEVCCode = async (req, res, next) => {
  try {
    const { code, price } = req.body;
    if (!code) {
      common.throwErrorMessage('Fields cannot be empty', 400);
    }
    if (isNaN(price)) {
      common.throwErrorMessage('price value should be a number', 400);
    }
    if (code?.length !== 8) {
      common.throwErrorMessage('Invalid Energy Voucher Code(EVC)', 400);
    }
    await models.EVCCode.exists({ code }, async (err, _doc) => {
      if (_doc) {
        res
          .status(400)
          .json({ message: 'Evc Code Already Exist' });
      } else {
        await models.EVCCode.create({ code, price }).then(() => {
          res.json({ message: 'added Energy Voucher Code Successfully' });
        }).catch((error) => {
          logger.error(error);
          next(error);
        });
      }
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const getEVCCode = async (req, res, next) => {
  try {
    const evcCodes = await models.EVCCode.find().populate('owner')
      .sort({ _id: -1 })
      .lean();
    const data = {
      evcCodes,
    };
    res.json(data);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const getUserList = async (req, res, next) => {
  try {
    const user = await models.User.find({ isAdmin: false })
      .sort({ _id: -1 })
      .lean();
    const data = {
      user,
    };
    res.json(data);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const userLimit = async (req, res, next) => {
  try {
    const { userId, status } = req.body;
    if (!userId) {
      common.throwErrorMessage('Fields cannot be empty', 400);
    }
    await models.User.findByIdAndUpdate(
      userId,
      { $set: { status } },
      { new: true },
    );
    const flag = status ? 'enabled' : 'disabled';
    const message = `user ${flag} successfully`;
    res.json({ message });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const getBillList = async (req, res, next) => {
  try {
    const bills = await models.Bill.find({ paid: { $ne: 'Not Required' } }).populate('user')
      .sort({ _id: -1 })
      .lean();
    const data = {
      bills,
    };
    res.json(data);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const payViaAdmin = async (req, res, next) => {
  try {
    const { billId } = req.body;
    if (!billId) {
      common.throwErrorMessage('Fields cannot be empty', 400);
    }
    const bill = await models.Bill.findByIdAndUpdate(billId, { paid: 'Paid' }, { new: true });
    if (bill) {
      res.json({ message: 'Bill Paid Successfully' });
    }
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const getStatistics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalBalance,
      disabledUsers,
      bills,
      evcLeft,
      graph1,
      graph2,
      evcExpired,
      graph5,
    ] = await Promise.all([
      models.User.countDocuments({ isAdmin: false }),
      models.User.aggregate([
        {
          $group: {
            _id: null,
            totalWalletBalance: { $sum: '$wallet' },
          },
        },
      ]),
      models.User.countDocuments({ status: false }),
      models.Bill.find({ paid: { $ne: 'Not Required' } }).sort({ _id: 1 }),
      models.EVCCode.countDocuments({ expired: false }),
      models.User.distinct('propertyType'),
      models.User.distinct('bedRooms'),
      models.EVCCode.find({ expired: true }),
      models.Bill.aggregate([
        { $sort: { amount: -1 } },
        { $limit: 3 },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            amount: 1,
            username: '$user.username',
          },
        },
      ]),
    ]);
    // statistics calculations
    const [{ totalWalletBalance }] = totalBalance;
    const totalsPaidAndUnPaid = bills.reduce((accumulator, currentBill) => {
      if (currentBill.paid === 'Paid') {
        accumulator.paid += currentBill.amount;
      } else {
        accumulator.unpaid += currentBill.amount;
      }
      return accumulator;
    }, { paid: 0, unpaid: 0 });
    // graph1 calculation: pie graph property type
    const graph1pie = [];
    for (const propertyType of graph1) {
      const count = await models.User.countDocuments({ propertyType });
      graph1pie.push({ type: propertyType, value: count });
    }
    // graph2 calculation pie graph bedroom
    const graph2pie = [];
    for (const bedRooms of graph2) {
      const count = await models.User.countDocuments({ bedRooms });
      graph2pie.push({ type: bedRooms, value: count });
    }
    // graph3 calculation of evc expired/month
    const expiredEVCCodesPerMonth = {};
    evcExpired.forEach((evcCode) => {
      const month = evcCode.expiredAt.getMonth();
      if (!expiredEVCCodesPerMonth[month]) {
        expiredEVCCodesPerMonth[month] = 0;
      }
      expiredEVCCodesPerMonth[month] += evcCode.price;
    });
    const graph3 = Object.entries(expiredEVCCodesPerMonth).map(([month, total]) => ({
      month: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(0, month)),
      total,
    }));
    // g4 calculation
    const usageData = {};
    for (const bill of bills) {
      const date = new Date(bill.date);
      const monthIndex = date.getMonth();
      if (!usageData[monthIndex]) {
        usageData[monthIndex] = {
          electricityDay: 0,
          electricityNight: 0,
          gas: 0,
        };
      }
      usageData[monthIndex].electricityDay += bill.electricity.day;
      usageData[monthIndex].electricityNight += bill.electricity.night;
      usageData[monthIndex].gas += bill.gas;
    }
    const totalUsageData = [];
    for (const monthIndex in usageData) {
      const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(0, monthIndex));
      totalUsageData.push({
        month,
        type: 'electricity day',
        usage: usageData[monthIndex].electricityDay,
      });
      totalUsageData.push({
        month,
        type: 'electricity night',
        usage: usageData[monthIndex].electricityNight,
      });
      totalUsageData.push({
        month,
        type: 'gas',
        usage: usageData[monthIndex].gas,
      });
    }
    const result = {
      totalUsers,
      totalWalletBalance,
      disabledUsers,
      totalsPaidAndUnPaid,
      evcLeft,
      graph1pie,
      graph2pie,
      graph3,
      graph4: totalUsageData,
      graph5,
    };
    res.json(result);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

module.exports = {
  getCostControl,
  UpdateCostControl,
  AddEVCCode,
  getEVCCode,
  getUserList,
  userLimit,
  getBillList,
  payViaAdmin,
  getStatistics,
};
