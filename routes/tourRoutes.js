const express = require('express');
const tourService = require('../services/tourService');
const authService = require('../services/authService');
const reviewRouter = require('./reviewRoutes');
const bookingRouter = require('./bookingRoutes');
const {
  createTourValidator,
  getTourValidator,
  updateTourValidator,
  deleteTourValidator,
} = require('./../utils/validators/tourValidator');

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

router.use('/:tourId/bookings', bookingRouter);

router
  .route('/top-5-cheap')
  .get(tourService.aliasTopTours, tourService.getAllTours);

router.route('/tour-stats').get(tourService.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authService.protect,
    authService.allowedTo('admin', 'lead-guide', 'guide'),
    tourService.getMonthlyPlan,
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourService.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourService.getDistances);

router
  .route('/')
  .get(tourService.getAllTours)
  .post(
    authService.protect,
    authService.allowedTo('admin', 'lead-guide'),
    createTourValidator,
    tourService.createTour,
  );

router
  .route('/:id')
  .get(getTourValidator, tourService.getTour)
  .patch(
    authService.protect,
    authService.allowedTo('admin', 'lead-guide'),
    tourService.uploadTourImages,
    tourService.resizeTourImages,
    updateTourValidator,
    tourService.updateTour,
  )
  .delete(
    authService.protect,
    authService.allowedTo('admin', 'lead-guide'),
    deleteTourValidator,
    tourService.deleteTour,
  );

module.exports = router;
