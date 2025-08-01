const { validationResult } = require('express-validator');

// @des middleware ==> catach errors from rules if exist

exports.validatorMiddleware = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
