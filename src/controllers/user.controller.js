/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-globals */
const common = require('./common');
const models = require('../models');
const logger = require('../logger/logger');

const addUsage = async (req, res, next) => {
  try {
    const {
      electricityDay, electricityNight, gas,
    } = req.body;

    if (!electricityDay || !electricityNight || !gas) {
      common.throwErrorMessage('Fields cannot be empty', 400);
    }
    if (isNaN(electricityDay) || isNaN(electricityNight) || isNaN(gas)) {
      common.throwErrorMessage('Fields should be a number', 400);
    }
    const { userInfo } = req;
    const count = await models.Bill.count({ user: userInfo._id });
    if (count === 0) {
      await models.Bill.create({
        user: userInfo._id,
        electricity: {
          day: electricityDay,
          night: electricityNight,
        },
        gas,
        paid: 'Not Required',
      }).then(() => {
        res.json({ message: 'added Energy Usage Successfully' });
      }).catch((error) => {
        logger.error(error);
        next(error);
      });
    }
    if (count > 0) {
      const LastUsage = await models.Bill.findOne({ user: userInfo._id })
        .sort({ _id: -1 })
        .lean();
      const price = await models.Charges
        .findOne({ name: 'default' })
        .lean();
      // usage calculation
      const timeLeft = (new Date()).getTime() - LastUsage.date;
      const totalDays = Math.ceil((((timeLeft / 1000) / 60) / 60) / 24);
      const electricityDayCharge = (electricityDay - LastUsage.electricity.day)
       * Number(price.electricity.day);
      const electricityNightCharge = (electricityNight - LastUsage.electricity.night)
       * Number(price.electricity.night);
      const gasCharge = (gas - LastUsage.gas)
      * Number(price.gas);
      const standingCharge = (totalDays) * Number(price.standingCharge);
      const averageElectricityPerDay = (electricityDayCharge + electricityNightCharge)
       / (totalDays);
      const averageGasPerDay = gasCharge / (totalDays);
      const amount = electricityDayCharge + electricityNightCharge + gasCharge + standingCharge;
      await models.Bill.create({
        user: userInfo._id,
        electricity: {
          day: electricityDay,
          night: electricityNight,
        },
        gas,
        amount,
        averageGasPerDay,
        averageElectricityPerDay,
      }).then(() => {
        res.json({ message: 'New Energy Usage Bill Generated' });
      }).catch((error) => {
        logger.error(error);
        next(error);
      });
    }
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const listBillPayment = async (req, res, next) => {
  try {
    const { userInfo } = req;
    const billList = await models.Bill.find({ user: userInfo._id })
      .sort({ _id: -1 })
      .lean();
    const walletBalance = await models.User.findById(userInfo._id)
      .lean();
    const data = {
      billList,
      walletBalance: walletBalance?.wallet || 0,
    };
    res.json(data);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const payDue = async (req, res, next) => {
  try {
    const totalBill = req?.body.totalBill;
    if (totalBill === 0) {
      common.throwErrorMessage('No Payment Required', 400);
    }
    if (isNaN(totalBill)) {
      common.throwErrorMessage('Fields should be a number', 400);
    }
    const { userInfo } = req;
    const billList = await models.Bill.find({ user: userInfo._id })
      .sort({ _id: -1 })
      .lean();
    const unpaidBills = billList?.filter((bill) => bill.paid === 'Not Paid');
    const totalBillNow = unpaidBills?.reduce((total, bill) => total + bill.amount, 0);
    const walletBalance = await models.User.findById(userInfo._id)
      .lean();
    if (totalBillNow !== totalBill) {
      common.throwErrorMessage('Payment cannot be Continued (Mismatch in Data).please contact admin for further Information', 400);
    }
    if (totalBillNow > walletBalance?.wallet) {
      common.throwErrorMessage('Insufficient balance. Please recharge your Account', 400);
    }
    await models.User.findByIdAndUpdate(
      userInfo._id,
      { $inc: { wallet: -totalBillNow } },
      { new: true },
    ).exec();
    await models.Bill.updateMany({ user: userInfo._id, paid: 'Not Paid' }, { paid: 'Paid' });
    const message = 'Your Payment was Successful !';
    res.json(message);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const recharge = async (req, res, next) => {
  try {
    const { coupon } = req.body;
    const { userInfo } = req;
    const date = Date.now();
    if (!coupon) {
      common.throwErrorMessage('Fields cannot be empty', 400);
    }
    if (coupon?.length !== 8) {
      common.throwErrorMessage('Invalid Energy Voucher Code(EVC)', 400);
    }
    const evcCodeExists = await models.EVCCode.exists({ code: coupon });
    if (!evcCodeExists) {
      common.throwErrorMessage('Invalid Energy Voucher Code', 400);
    }
    const energyVoucherCode = await models.EVCCode.findOne({ code: coupon });
    if (energyVoucherCode.expired) {
      common.throwErrorMessage('Energy voucher expired or was redeemed by another user', 400);
    }
    await models.EVCCode.findOneAndUpdate({ _id: energyVoucherCode._id }, {
      owner: userInfo._id,
      expired: true,
      expiredAt: date,
    });
    await models.User.findByIdAndUpdate(
      userInfo._id,
      { $inc: { wallet: energyVoucherCode.price } },
      { new: true },
    ).exec();
    await models.Recharge.create({
      owner: userInfo._id,
      code: coupon,
      redeemed: energyVoucherCode.price,
    }).then(() => {
      res.json({ message: 'Recharge Successful' });
    }).catch((error) => {
      next(error);
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const listRecharge = async (req, res, next) => {
  try {
    const { userInfo } = req;
    const rechargeList = await models.Recharge.find({ owner: userInfo._id })
      .sort({ _id: -1 })
      .lean();
    const walletBalance = await models.User.findById(userInfo._id)
      .lean();
    const data = {
      rechargeList,
      walletBalance: walletBalance?.wallet || 0,
    };
    res.json(data);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};
module.exports = {
  addUsage,
  listBillPayment,
  payDue,
  recharge,
  listRecharge,
};
