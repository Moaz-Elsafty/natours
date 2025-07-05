const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Booking = require('../../models/bookingModel');
const { check, body } = require('express-validator');

const {
  validatorMiddleware,
} = require('../../middlewares/validatorMiddleware');

exports.getBookingValidator = [
  check('id').isMongoId().withMessage('Invalid ID format'),
  validatorMiddleware,
];

exports.createBookingValidator = [
  body('tour')
    .notEmpty()
    .withMessage('Provide the id of which tour you want to purchase')
    .isMongoId()
    .withMessage('Invalid ID format')
    .custom(async (id) => {
      const tour = await Tour.findOne({ _id: id });
      if (!tour) {
        throw new Error(`There is no tour with that id: ${id}`);
      }
      return true;
    }),

  body('user')
    .notEmpty()
    .withMessage('The booking must belong to a user')
    .isMongoId()
    .withMessage('Invalid ID format')
    .custom(async (id) => {
      const user = await User.findOne({ _id: id });
      if (!user) {
        throw new Error(`There is no user with that id: ${id}`);
      }
    }),

  body('price')
    .notEmpty()
    .withMessage('Booking must have a price')
    .isNumeric()
    .withMessage('Invalid price'),

  body('paid')
    .optional()
    .notEmpty()
    .withMessage(
      'Delcare wheather this booking is paid or not with true & false values',
    ),

  validatorMiddleware,
];

exports.updateBookingValidator = [
  body('tour')
    .optional()
    .notEmpty()
    .withMessage('Provide the id of which tour you want to purchase')
    .isMongoId()
    .withMessage('Invalid ID format')
    .custom(async (id) => {
      const tour = await Tour.findOne({ _id: id });
      if (!tour) {
        throw new Error(`There is no tour with that id: ${id}`);
      }
      return true;
    }),

  body('user')
    .optional()
    .notEmpty()
    .withMessage('The booking must belong to a user')
    .isMongoId()
    .withMessage('Invalid ID format')
    .custom(async (id) => {
      const user = await User.findOne({ _id: id });
      if (!user) {
        throw new Error(`There is no user with that id: ${id}`);
      }
    }),

  body('price')
    .optional()
    .notEmpty()
    .withMessage('Booking must have a price')
    .isNumeric()
    .withMessage('Invalid price'),

  body('paid')
    .optional()
    .notEmpty()
    .withMessage(
      'Delcare wheather this booking is paid or not with true & false values',
    ),
  validatorMiddleware,
];

exports.deleteBookingValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid ID format')
    .custom(async (id) => {
      const booked = await Booking.findOne({ _id: id });
      if (!booked) throw new Error(`There is no booking with this id: ${id}`);
      return true;
    }),
  validatorMiddleware,
];
