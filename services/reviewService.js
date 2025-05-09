const asyncHandler = require('express-async-handler');
const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

const ApiFeatures = require('../utils/apiFeatures');
const ApiError = require('../utils/apiError');

// for the nested route /api/v1/tours/:tourId/reviews
exports.createFilterObj = (req, res, next) => {
  let filterObj = {};
  if (req.params.tourId) filterObj = { tour: req.params.tourId };
  req.filterObj = filterObj;
  next();
};

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
