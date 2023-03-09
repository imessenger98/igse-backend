const jwt = require('jsonwebtoken');
const logger = require('../logger/logger');
const models = require('../models');

const throwErrorMessage = (statusCode, message) => {
  const error = new Error(message);
  error.code = statusCode;
  throw error;
};
const verifyAccessToken = async (req, res, next) => {
  try {
    const authHeader = req?.headers?.authorization;
    if (!authHeader) {
      throwErrorMessage(400, 'Unauthorized');
    }
    const token = authHeader && authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.userId = decodedToken.userId;
    const userDB = await models.User.findOne({ _id: decodedToken.userId });
    req.userInfo = JSON.parse(JSON.stringify(userDB));
    if (!req.userInfo.isAdmin) {
      throwErrorMessage(400, 'Unauthorized ,You don\'t have Access');
    }
    if (!req.userInfo.status) {
      throwErrorMessage(400, 'User was disabled by Admin.Please contact admin for further information');
    }
    next();
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const verifyAccessTokenUser = async (req, res, next) => {
  try {
    const authHeader = req?.headers?.authorization;
    if (!authHeader) {
      throwErrorMessage(400, 'Unauthorized');
    }
    const token = authHeader && authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.userId = decodedToken.userId;
    const userDB = await models.User.findOne({ _id: decodedToken.userId });
    req.userInfo = JSON.parse(JSON.stringify(userDB));
    if (!req.userInfo.status) {
      throwErrorMessage(400, 'User was disabled by Admin.Please contact admin for further information');
    }
    next();
  } catch (error) {
    logger.error(error);
    error.code = 401;
    next(error);
  }
};

module.exports = {
  verifyAccessToken,
  verifyAccessTokenUser,
};
