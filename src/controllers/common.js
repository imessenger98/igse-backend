/* eslint-disable consistent-return */
/* eslint-disable no-undef */
const jwt = require('jsonwebtoken');

const createAccessToken = (userId) => jwt.sign({
  userId,
}, process.env.ACCESS_TOKEN_SECRET, {
  expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
});

const createRefreshToken = (userId) => jwt.sign({
  userId,
}, process.env.REFRESH_TOKEN_SECRET, {
  expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
});

const throwErrorMessage = (message, statusCode) => {
  const error = new Error(message);
  error.code = statusCode;
  throw error;
};

module.exports = {
  createAccessToken,
  throwErrorMessage,
  createRefreshToken,
};
