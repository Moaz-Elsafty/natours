const express = require('express');
const multer = require('multer');
const authService = require('../services/authService');
const userService = require('../services/userService');
const bookingRouter = require('./bookingRoutes');
const {
  createUserValidator,
  getUserValidator,
  updateUserValidator,
  deleteUserValidator,
  updateUserPasswordValidator,
  updateLoggedUserValidator,
} = require('../utils/validators/userValidator');

const {
  logInValidator,
  singUpValidator,
} = require('../utils/validators/authValidator');

const router = express.Router();

// User
router.post('/signup', singUpValidator, authService.signup);
router.patch('/activate/:token', authService.activateAcc);

router.post('/refresh-token', authService.refreshTokenHandler);
router.post('/login', logInValidator, authService.login);
router.get('/logout', authService.logout);

router.post('/forgotPassword', authService.forgotPassword);
router.patch('/resetPassword/:token', authService.resetPassword);

// Protects all the routes after this middleware
router.use(authService.protect);

router.patch(
  '/updateMyPassword',
  updateUserPasswordValidator,
  authService.updatePassword,
);
router.get('/me', userService.getMe, userService.getUser);
router.patch(
  '/updateMe',
  userService.uploadUserPhoto,
  userService.resizeUserPhoto,
  userService.filterObject,
  updateLoggedUserValidator,
  userService.updateMe,
);
router.delete('/deleteMe', userService.deleteMe);

// Admins Operations
router.use(authService.allowedTo('admin'));

// get all the bookings for specific user
router.use('/:userId/bookings', bookingRouter);

router
  .route('/')
  .get(userService.getAllUsers)
  .post(createUserValidator, userService.createUser);
router
  .route('/:id')
  .get(getUserValidator, userService.getUser)
  .patch(updateUserValidator, userService.updateUser)
  .delete(deleteUserValidator, userService.deleteUser);

module.exports = router;
