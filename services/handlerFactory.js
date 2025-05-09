const asyncHandler = require('express-async-handler');

const ApiFeatures = require('../utils/apiFeatures');
const ApiError = require('../utils/apiError');

exports.getAll = (Model) =>
  asyncHandler(async (req, res) => {
    let filter = {};
    if (req.filterObj) filter = req.filterObj;

    // Build Query
    const documentCounts = await Model.countDocuments();
    const apiFeatures = new ApiFeatures(Model.find(filter), req.query)
      .pagination(documentCounts)
      .filter()
      .sort()
      .limitFields()
      .search();

    // Execute Query
    const { mongooseQuery, paginationResult } = apiFeatures;
    // const docs = await mongooseQuery.explain();
    const docs = await mongooseQuery;

    res.status(200).json({
      results: docs.length,
      paginationResult,
      data: docs,
    });
  });

exports.getOne = (Model, popOptions) =>
  asyncHandler(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(
        new ApiError(`No document found with that ID: ${req.params.id}`, 404),
      );
    }

    res.status(200).json({
      status: 'Success',
      data: {
        doc,
      },
    });
  });

exports.createOne = (Model) =>
  asyncHandler(async (req, res) => {
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc,
      },
    });
  });

exports.updateOne = (Model) =>
  asyncHandler(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(
        new ApiError(`No document found with that ID: ${req.params.id}`, 404),
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(
        new ApiError(`No document found with that ID: ${req.params.id}`, 404),
      );
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
