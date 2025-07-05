const express = require('express');
const reviewService = require('../services/reviewService');
const authService = require('../services/authService');

const {
  getReviewValidator,
  createReviewValidator,
  updateReviewValidator,
  deleteReviewValidator,
} = require('../utils/validators/reviewValidator');

const router = express.Router({ mergeParams: true });

router.use(authService.protect);

router
  .route('/')
  .get(reviewService.createFilterObj, reviewService.getAllReviews)
  .post(
    authService.allowedTo('user'),
    reviewService.setTourUserIds,
    createReviewValidator,
    reviewService.createReview,
  );
router
  .route('/:id')
  .get(getReviewValidator, reviewService.getReview)
  .patch(
    authService.allowedTo('user', 'admin'),
    updateReviewValidator,
    reviewService.updateReview,
  )
  .delete(
    authService.allowedTo('user', 'admin'),
    deleteReviewValidator,
    reviewService.deleteReview,
  );

module.exports = router;
