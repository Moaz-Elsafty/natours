const jwt = require('jsonwebtoken');

exports.generateAccessToken = (payload) =>
  jwt.sign({ id: payload }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });

exports.generateRefreshToken = (payload) =>
  jwt.sign({ id: payload }, process.env.JWT_REFRESH_SECRET_KEY, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE_TIME,
  });
