const { check, body } = require('express-validator');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');
const Booking = require('../../models/bookingModel');

const {
  validatorMiddleware,
} = require('../../middlewares/validatorMiddleware');

exports.getReviewValidator = [
  check('id')
    .notEmpty()
    .withMessage('Please provide the review ID')
    .isMongoId()
    .withMessage('Invalid ID format'),
  validatorMiddleware,
];

exports.createReviewValidator = [
  check('review').notEmpty().withMessage('Review can not be empty'),

  check('rating')
    .notEmpty()
    .withMessage('Review rating required')
    .isLength({ min: 1 })
    .withMessage('Minimum rating value is 1.0')
    .isLength({ max: 5 })
    .withMessage('Maximum rating value is 5.0'),

  check('tour')
    .notEmpty()
    .withMessage('Review must belong to a tour')
    .isMongoId()
    .withMessage('Invalid ID format')
    .custom(async (id) => {
      const tour = await Tour.findOne({ _id: id });
      if (!tour) throw new Error(`There is no tour with that id: ${id}`);
      return true;
    })
    // custom validatoin that not allowing and user to create a review on a tour that he hasn't booked
    .custom(async (val, { req }) => {
      // 1) Check if there is a booking with the same tourId and and logged in user
      const booked = await Booking.findOne({ tour: val, user: req.user._id });
      // 2) if there is no booking block the process
      if (!booked)
        throw new Error('You have to book the tour first to make a review');
      // 3) if there is, then proceed with the creation validation
      return true;
    }),

  check('user')
    .notEmpty()
    .withMessage('Review must belong to a user')
    .isMongoId()
    .withMessage('Invalid ID format')
    .custom(async (id) => {
      const user = await User.findOne({ _id: id });
      if (!user) throw new Error(`There is no user with that id: ${id}`);
      return true;
    }),
  validatorMiddleware,
];

exports.updateReviewValidator = [
  check('id')
    .notEmpty()
    .withMessage('Please provide the review ID')
    .isMongoId()
    .withMessage('Invalid ID format')
    // Check review ownership
    .custom(async (id, { req }) => {
      const review = await Review.findOne({ _id: id });
      if (!review) throw new Error(`There is no review with that id: ${id}`);

      if (review.user._id.toString() !== req.user._id.toString()) {
        console.log('in');
        throw new Error(`You are not allowed to perform this action`);
      }
      return true;
    }),

  body('review').optional().notEmpty().withMessage('Review can not be empty'),

  body('rating')
    .optional()
    .notEmpty()
    .withMessage('Review rating required')
    .isLength({ min: 1 })
    .withMessage('Minimum rating value is 1.0')
    .isLength({ max: 5 })
    .withMessage('Maximum rating value is 5.0'),
  validatorMiddleware,
];

exports.deleteReviewValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid ID format')
    // Check review ownership
    .custom(async (id, { req }) => {
      const review = await Review.findOne({ _id: id });
      if (!review) throw new Error(`There is no review with that id: ${id}`);

      if (review.user._id.toString() !== req.user._id.toString()) {
        throw new Error(`You are not allowed to perform this action`);
      }
      return true;
    }),
  validatorMiddleware,
];
