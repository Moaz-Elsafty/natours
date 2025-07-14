const express = require('express');
const bookingService = require('../services/bookingService');
const authService = require('../services/authService');

const {
  getBookingValidator,
  createBookingValidator,
  updateBookingValidator,
  deleteBookingValidator,
} = require('../utils/validators/bookingValidator');

const router = express.Router({ mergeParams: true });

router.use(authService.protect);

router.get('/checkout-session/:tourId', bookingService.getChechoutSession);

router.use(authService.allowedTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingService.createFilterObj, bookingService.getAllBooking)
  .post(
    createBookingValidator,
    bookingService.bookedBefore,
    bookingService.createBooking,
  );

router
  .route('/:id')
  .get(getBookingValidator, bookingService.getBooking)
  .patch(updateBookingValidator, bookingService.updateBooking)
  .delete(deleteBookingValidator, bookingService.deleteBooking);

module.exports = router;
