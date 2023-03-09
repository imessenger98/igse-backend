/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-globals */
const jwt = require('jsonwebtoken');
const logger = require('../logger/logger');
const models = require('../models');
const common = require('./common');

const signUp = async (req, res, next) => {
  try {
    const {
      userName,
      password,
      address,
      propertyType,
      evcCodes,
      bedRooms,
    } = req.body;
    const date = Date.now();
    if (!userName || !password || !address || !propertyType || !evcCodes || !bedRooms) {
      common.throwErrorMessage('Fields cannot be empty', 400);
    }
    if (isNaN(bedRooms)) {
      common.throwErrorMessage('bedRooms Should be a Number', 400);
    }
    if (password.length < 8) {
      common.throwErrorMessage(`
      password conditions:
       minimum password length is 8,
      `, 400);
    }
    if (evcCodes?.length !== 8) {
      common.throwErrorMessage('Invalid Energy Voucher Code(EVC) .Length of EVC code is 8', 400);
    }
    const duplicateEmail = await models.User.exists({ username: userName });
    if (duplicateEmail) {
      common.throwErrorMessage('Email already Exist', 400);
    }

    const evcCodeExists = await models.EVCCode.exists({ code: evcCodes });
    if (!evcCodeExists) {
      common.throwErrorMessage('EVC code does not exist.please contact Admin for a valid Energy Voucher Code', 400);
    }
    const energyVoucherCode = await models.EVCCode.findOne({ code: evcCodes });
    if (energyVoucherCode.expired) {
      common.throwErrorMessage('Energy voucher expired or was redeemed by another user', 400);
    }
    const userDB = await models.User({
      username: userName,
      password,
      address,
      propertyType,
      bedRooms,
      evcCodes: energyVoucherCode._id,
      wallet: energyVoucherCode.price,
    });
    await userDB.save();
    const accessToken = common.createAccessToken(userDB.id);
    const refreshToken = common.createRefreshToken(userDB.id);
    await models.EVCCode.findOneAndUpdate({ _id: energyVoucherCode._id }, {
      owner: userDB.id,
      expired: true,
      expiredAt: date,
    });
    logger.info(`new user created user id:${userDB.id}`);
    await models.Recharge.create({
      owner: userDB.id,
      code: evcCodes,
      redeemed: energyVoucherCode.price,
    });
    res.json({
      id: userDB.id,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const {
      username,
      password,
    } = req.body;
    if (!username || !password) {
      common.throwErrorMessage('Fields cannot be empty', 400);
    }
    if (password.length < 8) {
      common.throwErrorMessage(`
      password conditions:
       minimum password length is 8,
      `, 400);
    }
    const userDB = await models.User
      .findOne({ username })
      .select('+password')
      .exec();
    if (!userDB) {
      common.throwErrorMessage('Invalid Username or Password', 400);
    }
    const isValid = userDB.password === req.body.password;
    if (!isValid) {
      common.throwErrorMessage('Invalid Username or Password', 400);
    }
    if (!userDB?.status) common.throwErrorMessage('user disabled. Please contact Admin.', 400);
    const accessToken = common.createAccessToken(userDB.id);
    const refreshToken = common.createRefreshToken(userDB.id);
    logger.info(`user signed in userId: ${userDB.id}`);
    const userData = {
      id: userDB.id,
      isAdmin: userDB?.isAdmin,
      username: userDB?.username,
      accessToken,
      refreshToken,
    };
    const partnerData = {
      address: userDB?.address,
      bedRooms: userDB?.bedRooms,
      propertyType: userDB?.propertyType,
      evcCode: userDB?.evcCode,
    };
    let result = userData;
    if (!userDB?.isAdmin) {
      result = { ...userData, ...partnerData };
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const verifyRefreshToken = async (req, res, next) => {
  try {
    const token = req.body.refreshToken;
    if (!token) {
      common.throwErrorMessage('Login Expired', 401);
    }
    const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    req.userId = decodedToken.userId;
    await models.User.findById(decodedToken.userId).then((user) => {
      const accessToken = common.createAccessToken(user.id);
      const userData = {
        id: user.id,
        isAdmin: user?.isAdmin,
        username: user?.username,
        accessToken,
        refreshToken: token,
      };
      const partnerData = {
        address: user?.address,
        bedRooms: user?.bedRooms,
        propertyType: user?.propertyType,
        evcCode: user?.evcCode,
      };
      let result = userData;
      if (!user?.isAdmin) {
        result = { ...userData, ...partnerData };
      }
      res.json(result);
    }).catch((error) => {
      next(error);
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const {
      oldPassword,
      newPassword,
    } = req.body;
    if (!oldPassword || !newPassword) {
      common.throwErrorMessage('Fields cannot be empty', 400);
    }
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      common.throwErrorMessage('token not found', 400);
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.userId = decodedToken.userId;
    const userDB = await models.User
      .findById(decodedToken.userId)
      .select('+password')
      .exec();
    if (!userDB) {
      common.throwErrorMessage('Invalid Username or Password', 400);
    }
    const isValid = userDB.password === oldPassword;
    if (!isValid) {
      common.throwErrorMessage('Invalid Username or Password', 400);
    }
    await models.User.findByIdAndUpdate(
      decodedToken.userId,
      { $set: { password: newPassword } },
      { new: true },
    );
    res.json({ message: 'Password Changed Successfully' });
  } catch (error) {
    if (error.message === 'jwt expired') {
      error.code = 401;
    }
    next(error);
  }
};

const GetUserProfile = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      common.throwErrorMessage('token not found', 400);
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.userId = decodedToken.userId;
    const userDB = await models.User
      .findById(decodedToken.userId)
      .lean()
      .exec();
    if (!userDB) {
      common.throwErrorMessage('User not found', 400);
    }
    res.json({ userDB });
  } catch (error) {
    if (error.message === 'jwt expired') {
      error.code = 401;
    }
    next(error);
  }
};

module.exports = {
  signUp,
  login,
  changePassword,
  GetUserProfile,
  verifyRefreshToken,
};
