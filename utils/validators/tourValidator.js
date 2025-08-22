const { check, body, param } = require('express-validator');
const slugify = require('slugify');
const {
  validatorMiddleware,
} = require('../../middlewares/validatorMiddleware');
const User = require('../../models/userModel');
const Tour = require('../../models/tourModel');

exports.createTourValidator = [
  check('name')
    .isLength({ min: 5, max: 40 })
    .withMessage(
      'A tour name must have more than 5 characters and less than 40.',
    )
    .notEmpty()
    .withMessage('A tour must have a name.'),

  check('summary')
    .isString()
    .withMessage('Only acceptces strings')
    .isLength({ min: 8, max: 80 })
    .withMessage('The summary ranges between 8 to 100 characters')
    .notEmpty()
    .withMessage('A tour must have a summary'),

  check('description')
    .notEmpty()
    .withMessage('A tour must have a description')
    .isLength({ min: 40, max: 1500 })
    .withMessage('The description ranges between 40 to 1500 characters'),

  check('duration')
    .isNumeric()
    .withMessage('Tour duration must be a number.')
    .notEmpty()
    .withMessage('A tour must have a duration period.'),

  check('maxGroupSize')
    .isNumeric()
    .withMessage('Group size value must be a number')
    .notEmpty()
    .withMessage('A tour must have a group size determined.'),

  check('soldOut')
    .optional()
    .isBoolean()
    .withMessage('The value must be boolean')
    .notEmpty()
    .withMessage('Please determine whether  this tour is fully booked or not.'),

  check('waitingListAvailability')
    .notEmpty()
    .withMessage(
      'Please specify whether you want to allow waiting list to the this tour or not.',
    )
    .isBoolean()
    .withMessage('Only accepts True or False'),

  check('waitingList')
    // if waiting list availability is false then skip this validation
    .if(check('waitingListAvailability').equals('true'))
    .notEmpty()
    .withMessage('Please specifiy the waiting list details.')
    .isArray()
    .withMessage('The waiting must be an array of the dates')
    // Validate the users id
    .custom(async (val, { req }) => {
      const invalidUsers = [];
      for (let i = 0; i < val.length; i++) {
        const user = await User.findById(val[i].user);
        if (!user) invalidUsers.push(val[i].user);
      }

      if (invalidUsers.length > 0) {
        throw new Error(`Invalid users ids: ${invalidUsers}`);
      }

      return true;
    })
    // Custom validation to make sure the number of waiting list users does not exceed the waitingListLimit
    .custom((val, { req }) => {
      if (val.length > req.body.waitingListLimit) {
        throw new Error(
          'The number of waiting users exceeds the specified waiting list limit',
        );
      }
      return true;
    }),

  check('waitingListLimit')
    // if waiting list availability is false then skip this validation
    .if(check('waitingListAvailability').equals('true'))
    .isInt({ max: 20 })
    .withMessage('Only accepts numbers and not exceed 20'),

  check('difficulty')
    .notEmpty()
    .withMessage('A tour must have a difficulty.')
    .isString()
    .withMessage('Difficulty is either: easy, medium, difficult.'),

  check('ratingsAverage')
    .optional()
    .isNumeric()
    .withMessage('Rating must be a number.')
    .isLength({ min: 1, max: 5 })
    .withMessage('Rating must be above 1 and below 5.'),

  check('ratingsQuantity')
    .optional()
    .isNumeric()
    .withMessage('Rating must be a number.'),

  check('price')
    .isNumeric()
    .withMessage('The price type must be a number.')
    .notEmpty()
    .withMessage('A tour must have a price.'),

  check('priceAfterDiscount')
    .optional()
    .isNumeric()
    .withMessage('The price after discount must be a number.')
    .toFloat()
    .custom((val, { req }) => {
      if (req.body.price <= val) {
        throw new Error(
          'Price after discount must be lower than original price.',
        );
      }
    }),

  check('imageCover')
    // .notEmpty()
    // .withMessage('Tour must have a cover image to be created.')
    .optional()
    .custom((val) => {
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      return allowedExtensions.some((ext) => val.toLowerCase().endsWith(ext)); //will return true if the filename ends with any of the allowed extensions.
    })
    .withMessage(
      'Each image must be a string ending in .jpg, .jpeg, .png, or .webp',
    ),

  check('images')
    .optional()
    .isArray()
    .withMessage('Images should be an array of string.')
    .custom((images) => {
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

      const invalidImages = images.some((img) => {
        if (typeof img !== 'string') return true;

        return !allowedExtensions.some((ext) =>
          img.toLowerCase().endsWith(ext),
        );
      });

      return !invalidImages; // true = valid, false = error
    })
    .withMessage(
      'Each image must be a string ending in .jpg, .jpeg, .png, or .webp',
    ),

  check('startDates')
    .notEmpty()
    .withMessage('Please specifiy the starting dates of this tour.')
    .isArray()
    .withMessage('The starting dates must be an array of the dates')
    // custom vliadation for ensuring that all the inputs of "startDates" are real dates
    .custom((val) => {
      const invalidDates = val.filter((dateString) => {
        // 1) Ensure it is a string
        if (typeof dateString.date !== 'string') {
          return true;
        }
        // 2) Check if Date.parse() returns NaN
        const timeStamp = Date.parse(dateString.date);
        if (isNaN(timeStamp)) {
          return true;
        }
        // 3) Compare if the conversion of the input date string to ISO date !== input
        const inputDate = new Date(dateString.date);
        return inputDate.toISOString() !== dateString.date;
      });
      if (invalidDates.length > 0) {
        throw new Error('Please enter a valid starting dates');
      }
      return true;
    })
    // Custom validation to make sure all the input dates are set for future dates
    .custom((val) => {
      // Check if each date in the array is larger than Date.now() if not will be added to new array and stored in oldDates
      const oldDates = val.filter((dateString) => {
        if (Date.parse(dateString.date) < Date.now()) {
          return true;
        }
        return false;
      });
      // if oldDates.length > 0 then that mean there are old dates
      if (oldDates.length > 0) {
        throw new Error('Invalid input dates');
      }
      return true;
    })
    // Custom validation to make sure that each date participants does not exceed the number of maxGroupSize specified for the tour.
    .custom((val, { req }) => {
      val.filter((startDate) => {
        if (startDate.participants > req.body.maxGroupSize) {
          throw new Error(
            `This Date: ${startDate.date} exceeds the maxGroupSize specified for the tour`,
          );
        }

        if (startDate.participants === req.body.maxGroupSize) {
          startDate.soldOut = true;
        }
      });
      return true;
    })
    // Custom validation to loop on the dates if all are soldOut then soldOut field must change to true
    // if all the dates are soldOut then all the tour will be soldOut
    .custom((val, { req }) => {
      const startDates = val;

      const soldOut = startDates.filter((date) => {
        if (date.soldOut === true) {
          return true;
        }
        return false;
      });

      if (soldOut.length === startDates.length) {
        req.body.soldOut = true;
      }
      return true;
    }),

  check('guides')
    .notEmpty()
    .withMessage('The tour must have tour guides')
    .isArray()
    .withMessage('The input must be in array format')
    .isMongoId()
    .withMessage('Invalid IDs')
    //custom validation to check if the guides id exists in the DB also check their role and acc activation.
    .custom(async (val) => {
      // 1) Get all the users Id that their id exists in db, their role "guide OR "lead-guide", and their accs are active
      const users = await User.find({
        _id: { $in: val },
        role: { $in: ['guide', 'lead-guide'] },
        active: true,
      }).select('_id');
      // 2) Extracting the invalidIds
      const validIds = users.map((user) => user._id.toString());
      const inValidIds = val.filter((id) => !validIds.includes(id));
      // 3) Handle the error if there are invalid Ids
      if (inValidIds.length > 0) {
        throw new Error(
          `These IDs are invalid or not active guides: ${inValidIds.join(', ')}`,
        );
      }
      return true;
    }),

  check('startLocation.coordinates')
    .notEmpty()
    .withMessage('The tour must have its start location declared')
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be an array of [longitude, latitude]')
    // custom validation to validate that the input is in lng and lat valid range
    .custom(([lng, lat]) => {
      const validLng = typeof lng === 'number' && lng >= -180 && lng <= 180;
      const validLat = typeof lat === 'number' && lat >= -90 && lat <= 90;
      return validLng && validLat;
    })
    .withMessage('Invalid longitude or latitude values'),

  check('locations')
    .notEmpty()
    .withMessage("The tour's locations must be declared")
    .isArray()
    .withMessage('The input must be in array format')
    // custom validation to validate that each tour coordinates are in the valid range
    .custom((val) => {
      const invalidCoordinates = val.filter((location) => {
        const [lng, lat] = location.coordinates;
        const invalidLng = typeof lng !== 'number' || lng < -180 || lng > 180;
        const invalidLat = typeof lat !== 'number' || lat < -90 || lat > 90;
        return invalidLng || invalidLat;
      });

      return invalidCoordinates.length === 0; // returns true if all are valid
    })
    .withMessage(
      'Some coordinates are invalid. Each must be [lng (-180 to 180), lat (-90 to 90)]',
    ),
  validatorMiddleware,
];

exports.getTourValidator = [
  check('id').isMongoId().withMessage('Invalid ID Format'),
  validatorMiddleware,
];

exports.updateTourValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID Format')
    .custom(async (val) => {
      const tour = await Tour.findById(val);

      if (!tour) {
        throw new Error("'This tour doesn't exist anymore.");
      }
      return true;
    }),

  check('name')
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  check('duration')
    .optional()
    .isNumeric()
    .withMessage('Tour duration must be a number.')
    .notEmpty()
    .withMessage('A tour must have a duration period.'),

  check('maxGroupSize')
    .optional()
    .isNumeric()
    .withMessage('Group size value must be a number')
    .notEmpty()
    .withMessage('A tour must have a group size determined.'),

  check('soldOut')
    .optional()
    .isBoolean()
    .withMessage('The value must be boolean')
    .default(false),

  check('waitingListAvailability')
    .optional()
    .notEmpty()
    .withMessage(
      'Please specify whether you want to allow waiting list to the this tour or not.',
    )
    .isBoolean()
    .withMessage('Only accepts True or False'),

  check('waitingList')
    .optional()
    // if waiting list availability is false then skip this validation
    .if(check('waitingListAvailability').equals('true'))
    .notEmpty()
    .withMessage('Please specifiy the waiting list details.')
    .isArray()
    .withMessage('The waiting must be an array of the dates')
    // Validate the users id
    .custom(async (val, { req }) => {
      const invalidUsers = [];
      for (let i = 0; i < val.length; i++) {
        const user = await User.findById(val[i].user);
        if (!user) invalidUsers.push(val[i].user);
      }

      if (invalidUsers.length > 0) {
        throw new Error(`Invalid users ids: ${invalidUsers}`);
      }

      return true;
    })
    // Custom validation to make sure the number of waiting list users does not exceed the waitingListLimit
    .custom((val, { req }) => {
      if (val.length > req.body.waitingListLimit) {
        throw new Error(
          'The number of waiting users exceeds the specified waiting list limit',
        );
      }
      return true;
    }),

  check('waitingListLimit')
    .optional()
    // if waiting list availability is false then skip this validation
    .if(check('waitingListAvailability').equals('true'))
    .isInt({ max: 20 })
    .withMessage('Only accepts numbers and not exceed 20'),

  check('difficulty')
    .optional()
    .notEmpty()
    .withMessage('A tour must have a difficulty.')
    .isString()
    .withMessage('Difficulty is either: easy, medium, difficult.'),

  check('price')
    .optional()
    .isNumeric()
    .withMessage('The price type must be a number.')
    .notEmpty()
    .withMessage('A tour must have a price.'),

  check('priceAfterDiscount')
    .optional()
    .isNumeric()
    .withMessage('The price after discount must be a number.')
    .toFloat()
    .custom((val, { req }) => {
      if (req.body.price <= val) {
        throw new Error(
          'Price after discount must be lower than original price.',
        );
      }
    }),

  check('imageCover')
    .optional()
    .notEmpty()
    .withMessage('Tour must have a cover image to be created.')
    .custom((val) => {
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      return allowedExtensions.some((ext) => val.toLowerCase().endsWith(ext)); //will return true if the filename ends with any of the allowed extensions.
    })
    .withMessage(
      'Each image must be a string ending in .jpg, .jpeg, .png, or .webp',
    ),

  check('images')
    .optional()
    .isArray()
    .withMessage('Images should be an array of string.')
    .custom((images) => {
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

      const invalidImages = images.some((img) => {
        if (typeof img !== 'string') return true;

        return !allowedExtensions.some((ext) =>
          img.toLowerCase().endsWith(ext),
        );
      });

      return !invalidImages; // true = valid, false = error
    })
    .withMessage(
      'Each image must be a string ending in .jpg, .jpeg, .png, or .webp',
    ),

  check('startDates')
    .optional()
    .notEmpty()
    .withMessage('Please specifiy the starting dates of this tour.')
    .isArray()
    .withMessage('The starting dates must be an array of the dates')
    // custom vliadation for ensuring that all the inputs of "startDates" are real dates
    .custom((val) => {
      const invalidDates = val.filter((dateString) => {
        // 1) Ensure it is a string
        if (typeof dateString.date !== 'string') {
          return true;
        }
        // 2) Check if Date.parse() returns NaN
        const timeStamp = Date.parse(dateString.date);
        if (isNaN(timeStamp)) {
          return true;
        }
        // 3) Compare if the conversion of the input date string to ISO date !== input
        const inputDate = new Date(dateString.date);
        return inputDate.toISOString() !== dateString.date;
      });
      if (invalidDates.length > 0) {
        throw new Error('Please enter a valid starting dates');
      }
      return true;
    })
    // Custom validation to make sure all the input dates are set for future dates
    .custom((val) => {
      // Check if each date in the array is larger than Date.now() if not will be added to new array and stored in oldDates
      const oldDates = val.filter((dateString) => {
        if (Date.parse(dateString) < Date.now()) {
          return true;
        }
        return false;
      });
      // if oldDates.length > 0 then that mean there are old dates
      if (oldDates.length > 0) {
        throw new Error('Invalid input dates');
      }
      return true;
    })
    // Custom validation to make sure that each date participants does not exceed the number of maxGroupSize specified for the tour.
    .custom(async (val, { req }) => {
      const tour = await Tour.findById(req.params.id);
      val.filter((startDate) => {
        if (startDate.participants > tour.maxGroupSize) {
          throw new Error(
            `This Date: ${startDate.date} exceeds the maxGroupSize specified for the tour`,
          );
        }

        if (startDate.participants === tour.maxGroupSize) {
          startDate.soldOut = true;
        } else {
          startDate.soldOut = false;
        }
      });
      return true;
    })
    // if all the dates are soldOut then update the whole tour to be soldOut
    .custom(async (val, { req }) => {
      const tour = await Tour.findById(req.params.id);
      const startDates = val;

      const soldOut = startDates.filter((date) => {
        if (date.soldOut === true) {
          return true;
        }
        return false;
      });

      if (soldOut.length === startDates.length) {
        tour.soldOut = true;
      } else {
        tour.soldOut = false;
      }
      return true;
    }),

  check('guides')
    .optional()
    .notEmpty()
    .withMessage('The tour must have tour guides')
    .isArray()
    .withMessage('The input must be in array format')
    .isMongoId()
    .withMessage('Invalid IDs')
    //custom validation to check if the guides id exists in the DB also check their role and acc activation.
    .custom(async (val) => {
      // 1) Get all the users Id that their id exists in db, their role "guide OR "lead-guide", and their accs are active
      const users = await User.find({
        _id: { $in: val },
        role: { $in: ['guide', 'lead-guide'] },
        active: true,
      }).select('_id');
      // 2) Extracting the invalidIds
      const validIds = users.map((user) => user._id.toString());
      const inValidIds = val.filter((id) => !validIds.includes(id));
      // 3) Handle the error if there are invalid Ids
      if (inValidIds.length > 0) {
        throw new Error(
          `These IDs are invalid or not active guides: ${inValidIds.join(', ')}`,
        );
      }
      return true;
    }),

  check('startLocation.coordinates')
    .optional()
    .notEmpty()
    .withMessage('The tour must have its start location declared')
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be an array of [longitude, latitude]')
    // custom validation to validate that the input is in lng and lat valid range
    .custom(([lng, lat]) => {
      const validLng = typeof lng === 'number' && lng >= -180 && lng <= 180;
      const validLat = typeof lat === 'number' && lat >= -90 && lat <= 90;
      return validLng && validLat;
    })
    .withMessage('Invalid longitude or latitude values'),

  check('locations')
    .optional()
    .notEmpty()
    .withMessage("The tour's locations must be declared")
    .isArray()
    .withMessage('The input must be in array format')
    // custom validation to validate that each tour coordinates are in the valid range
    .custom((val) => {
      const invalidCoordinates = val.filter((location) => {
        const [lng, lat] = location.coordinates;
        const invalidLng = typeof lng !== 'number' || lng < -180 || lng > 180;
        const invalidLat = typeof lat !== 'number' || lat < -90 || lat > 90;
        return invalidLng || invalidLat;
      });

      return invalidCoordinates.length === 0; // returns true if all are valid
    })
    .withMessage(
      'Some coordinates are invalid. Each must be [lng (-180 to 180), lat (-90 to 90)]',
    ),

  validatorMiddleware,
];

exports.deleteTourValidator = [
  check('id').isMongoId().withMessage('Invalid ID Format'),
  validatorMiddleware,
];
