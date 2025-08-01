const { check, body } = require('express-validator');
const {
  validatorMiddleware,
} = require('../../middlewares/validatorMiddleware');
const User = require('../../models/userModel');

// Admins Validations
exports.createUserValidator = [
  check('name')
    .notEmpty()
    .withMessage('Please provide a name')
    .isLength({ min: 3, max: 15 })
    .withMessage(
      'The name is too long or too short, The valid range is from 3 characters to 15 ',
    ),

  check('email')
    .notEmpty()
    .withMessage('Email required')
    .isEmail()
    .withMessage('Invalid Email Format')
    .custom(async (val) => {
      const user = await User.findOne({ email: val });
      if (user) {
        throw new Error('This E-mail is already in use.');
      }
      return true;
    }),

  check('password')
    .notEmpty()
    .withMessage('Password required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .custom((password, { req }) => {
      if (password !== req.body.passwordConfirm) {
        throw new Error('Password confirmation is incorrect');
      }
      return true;
    }),

  check('passwordConfirm')
    .notEmpty()
    .withMessage('Password confirmation required'),

  check('photo').optional(),

  check('role').optional(),
  validatorMiddleware,
];

exports.getUserValidator = [
  check('id').isMongoId().withMessage('Invalid ID Format'),
  validatorMiddleware,
];

exports.updateUserValidator = [
  check('id').isMongoId().withMessage('Invalid ID Format'),

  check('name')
    .optional()
    .notEmpty()
    .withMessage('Please provide a name')
    .isLength({ min: 3, max: 15 })
    .withMessage(
      'The name is too long or too short, The valid range is from 3 characters to 15 ',
    ),

  body('email')
    .optional()
    .notEmpty()
    .withMessage('Email required')
    .isEmail()
    .withMessage('Invalid Email Format')
    .custom(async (val) => {
      const user = await User.findOne({ email: val });
      if (user) {
        throw new Error('This E-mail is already in use.');
      }
      return true;
    }),

  check('password')
    .optional()
    .notEmpty()
    .withMessage('Password required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .custom((password, { req }) => {
      if (password !== req.body.passwordConfirm) {
        throw new Error('Password confirmation is incorrect');
      }
      return true;
    }),

  check('passwordConfirm')
    .optional()
    .notEmpty()
    .withMessage('Password confirmation required'),

  check('photo').optional(),

  check('role').optional(),
  validatorMiddleware,
];

exports.deleteUserValidator = [
  check('id').isMongoId().withMessage('Invlalid ID Format'),
  validatorMiddleware,
];

// Users Validations

exports.updateLoggedUserValidator = [
  check('name')
    .optional()
    .notEmpty()
    .withMessage('Please provide a name')
    .isLength({ min: 3, max: 15 })
    .withMessage(
      'The name is too long or too short, The valid range is from 3 characters to 15 ',
    ),

  body('email')
    .optional()
    .notEmpty()
    .withMessage('Email required')
    .isEmail()
    .withMessage('Invalid Email Format')
    .custom(async (val) => {
      const user = await User.findOne({ email: val });
      if (user) {
        throw new Error('This E-mail is already in use.');
      }
      return true;
    }),

  check('photo').optional(),
  validatorMiddleware,
];

exports.updateUserPasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('You must enter your current password'),

  body('password')
    .notEmpty()
    .withMessage('You must enter new password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .custom((password, { req }) => {
      if (password !== req.body.passwordConfirm) {
        throw new Error('Password confirmation incorrect');
      }
      return true;
    }),

  body('passwordConfirm')
    .notEmpty()
    .withMessage('You must enter the password confirmation'),
  validatorMiddleware,
];
