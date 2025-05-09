const express = require('express');
const multer = require('multer');
const authService = require('../services/authService');
const userService = require('../services/userService');

const router = express.Router();

router.post('/signup', authService.signup);
router.post('/login', authService.login);
router.get('/logout', authService.logout);

router.post('/forgotPassword', authService.forgotPassword);
router.patch('/resetPassword/:token', authService.resetPassword);

// Protects all the routes after this middleware
router.use(authService.protect);

router.patch('/updateMyPassword', authService.updatePassword);
router.get('/me', userService.getMe, userService.getUser);
router.patch(
  '/updateMe',
  userService.uploadUserPhoto,
  userService.resizeUserPhoto,
  userService.filterObject,
  userService.updateMe,
);
router.delete('/deleteMe', userService.deleteMe);

router.use(authService.allowedTo('admin'));

router.route('/').get(userService.getAllUsers);
router
  .route('/:id')
  .get(userService.getUser)
  .patch(userService.updateUser)
  .delete(userService.deleteUser);

module.exports = router;
