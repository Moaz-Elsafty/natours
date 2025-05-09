const express = require('express');
const bookingService = require('../services/bookingService');
const authService = require('../services/authService');

const router = express.Router();

router.use(authService.protect);

router.get('/checkout-session/:tourId', bookingService.getChechoutSession);

router.use(authService.allowedTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingService.getAllBooking)
  .post(bookingService.createBooking);

router
  .route('/:id')
  .get(bookingService.getBooking)
  .patch(bookingService.updateBooking)
  .delete(bookingService.deleteBooking);

module.exports = router;
