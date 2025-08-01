const express = require('express');
const viewsServices = require('../services/viewServices');
const authService = require('../services/authService');
const bookingService = require('../services/bookingService');

const router = express.Router();

router.get(
  '/',
  bookingService.createBookingCheckout,
  authService.isLoggetIn,
  viewsServices.getOverview,
);
router.get('/tour/:slug', authService.isLoggetIn, viewsServices.getTour);
router.get('/login', authService.isLoggetIn, viewsServices.getLoginForm);
router.get('/me', authService.protect, viewsServices.getAccount);
router.get('/my-tours', authService.protect, viewsServices.getMyTours);

router.post(
  '/submit-user-data',
  authService.protect,
  viewsServices.updateUserData,
);

module.exports = router;
