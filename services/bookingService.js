const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const asyncHandler = require('express-async-handler');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel.js');
const factory = require('../services/handlerFactory.js');
const ApiError = require('../utils/apiError.js');

exports.getChechoutSession = asyncHandler(async (req, res, next) => {
  // 1) Get the booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://natours.dev/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = asyncHandler(async (req, res, next) => {
  // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

// For Admins and Manual creation

// This function prevents the same user to book the same tour twice
exports.bookedBefore = async (req, res, next) => {
  // 1) get booking with the tourID & userID if exists
  const booked = await Booking.findOne({
    tour: req.body.tour,
    user: req.body.user,
  });

  // 2) if exists reject the request
  if (booked) {
    return next(
      new ApiError(
        'There is a booking with that same tour by the same user',
        400,
      ),
    );
  }

  next();
};

// for the nested route /api/v1/tours/:tourId/bookings
// &
// for the nested route /api/v1/users/:id/bookings
exports.createFilterObj = (req, res, next) => {
  let filterObj = {};
  if (req.params.tourId) filterObj = { tour: req.params.tourId };
  if (req.params.userId) filterObj = { user: req.params.userId };
  req.filterObj = filterObj;
  next();
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
