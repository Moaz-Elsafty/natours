const express = require('express');
const reviewService = require('../services/reviewService');
const authService = require('../services/authService');

const router = express.Router({ mergeParams: true });

router.use(authService.protect);

router
  .route('/')
  .get(reviewService.createFilterObj, reviewService.getAllReviews)
  .post(
    authService.allowedTo('user'),
    reviewService.setTourUserIds,
    reviewService.createReview,
  );
router
  .route('/:id')
  .get(reviewService.getReview)
  .patch(authService.allowedTo('user', 'admin'), reviewService.updateReview)
  .delete(authService.allowedTo('user', 'admin'), reviewService.deleteReview);

module.exports = router;
