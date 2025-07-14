const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      min: [1, 'Minimum rating value is 1.0'],
      max: [5, 'Maximum rating value is 5.0'],
      required: [true, 'Review rating required'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    timestamps: true,
  },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Query Middleware
// reviewSchema.pre(/^find/, function (next) {
//   this.populate([
//     {
//       path: 'user',
//       select: 'name photo',
//     },
//     {
//       path: 'tour',
//       select: 'name',
//     },
//   ]);
//   next();
// });

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const result = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (result.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: result[0].nRating,
      ratingsAverage: result[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// updating the ratingsQuantity & ratingsAverage whenever a new review is posted
reviewSchema.post('save', async function () {
  // this points to current review
  await this.constructor.calcAverageRatings(this.tour);
});

// The below middleware is a Query Middleware
// updating the ratingsQuantity & ratingsAverage whenever a review has been updated or deleted
reviewSchema.post(/^findOneAnd/, async function (doc) {
  await doc.constructor.calcAverageRatings(doc.tour);
});

module.exports = mongoose.model('Review', reviewSchema);
