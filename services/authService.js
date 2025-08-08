const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const ApiError = require('../utils/apiError');
const Email = require('../utils/email');
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/generateTokens');

const { encrypt, decrypt } = require('../utils/encryption');

const createSendToken = async (user, statusCode, req, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Hash the refresh token before storing in DB
  const hashedRefreshToken = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  // Save hashed token to DB
  user.refreshToken = hashedRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie('accessToken', accessToken, {
    expires: new Date(Date.now() + 15 * 60 * 1000),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  // Removes password and refreshToken from the output
  user.password = undefined;
  user.refreshToken = undefined;

  res.status(statusCode).json({
    status: 'success',
    accessToken,
    refreshToken,
    data: {
      user,
    },
  });
};

// Enable 2FA
exports.enable2FA = asyncHandler(async (req, res, next) => {
  const secret = speakeasy.generateSecret({
    name: `MyApp (${req.user.email})`,
  });

  const encryptedSecret = encrypt(secret.base32);
  // Store secret.base32 in your DB for this user
  await User.findByIdAndUpdate(req.user.id, {
    twoFAEnabled: true,
    twoFASecret: encryptedSecret,
  });

  // Generate QR code for scanning
  qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
    if (err) return next(new ApiError('QR Code error', 500));
    res.json({ qrcode: data_url });
  });
});

// Disable 2FA
exports.disable2FA = asyncHandler(async (req, res, next) => {
  // 1) First check if the user logged in or not
  if (!req.user) {
    return next(new ApiError('You have to log in first', 401));
  }

  // 2) Find the user that want to disable 2FA from DB
  const user = await User.findById(req.user.id);

  // 3) Update the value of "twoFAEnabled" to be false & twoFASecret to be undefined
  user.twoFAEnabled = false;
  user.twoFASecret = undefined;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json({ status: 'success', message: '2FA has been disabled successfully' });
});

// Verify 2FA
exports.verify2FA = asyncHandler(async (req, res, next) => {
  const { userId, token } = req.body;

  const user = await User.findById(userId);

  const decryptedSecret = decrypt(user.twoFASecret);

  const verified = speakeasy.totp.verify({
    secret: decryptedSecret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!verified) {
    return next(new ApiError('Invalid or expired 2FA token', 401));
  }

  createSendToken(user, 200, req, res);
});

exports.signup = asyncHandler(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  // Prepare the activation url and then send it to the user via email to activate his account first.
  const token = newUser.createActivationToken();
  await newUser.save({ validateBeforeSave: false });

  try {
    const url = `${req.protocol}://${req.get('host')}/api/v1/users/activate/${token}`;
    await new Email(newUser, url).sendWelcome();
  } catch (err) {
    newUser.activationToken = undefined;
    newUser.activationExpires = undefined;

    await newUser.save({ validateBeforeSave: false });

    return next(
      new ApiError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'Activation token sent to your email!',
  });
  // createSendToken(newUser, 201, req, res);
});

// Activate Account
exports.activateAcc = asyncHandler(async (req, res, next) => {
  const hashedActivationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // 1) Get user based on the token
  const user = await User.findOne({
    activationToken: hashedActivationToken,
    activationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ApiError('Token is invalid or has expired', 400));
  }
  // 2) Activate the Account
  user.active = true;
  user.activationToken = undefined;
  user.activationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  // 3) Send the token via email
  res.status(200).json({ message: 'Account activated successfully' });
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new ApiError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new ApiError('Incorrect email or password', 401));
  }

  if (!user.active) {
    return next(new ApiError('Please activate your account first', 403));
  }

  // 3) Check if 2FA is enabled
  if (user.twoFAEnabled && user.twoFASecret) {
    return res.status(200).json({
      status: '2fa_requried',
      userId: user._id,
      message: 'Two-factor authentication code required',
    });
  }

  // 4) if everything ok & 2FA not enabled → issue tokens.
  createSendToken(user, 200, req, res);
});

exports.refreshTokenHandler = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new ApiError('Refresh token required', 400));
  }

  // Hash incoming refresh token
  const hashedToken = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  // Find user with that hashed refresh token
  const user = await User.findOne({ refreshToken: hashedToken });

  if (!user) {
    return next(new ApiError('Invalid refresh token', 403));
  }

  // Verify the token is valid and not tampered with
  let decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY);

  if (!decoded) {
    return next(new ApiError('Invalid or expired refresh token', 403));
  }

  if (decoded.id !== user.id) {
    return next(new ApiError('Token mismtach', 403));
  }

  // Issue a new access token
  const newAccessToken = generateAccessToken(user._id);

  res.cookie('accessToken', newAccessToken, {
    expires: new Date(Date.now() + 15 * 60 * 1000),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  res.status(200).json({
    status: 'success',
    accessToken: newAccessToken,
  });
});

exports.logout = asyncHandler((req, res) => {
  res.cookie('accessToken', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
});

exports.protect = asyncHandler(async (req, res, next) => {
  // 1) Geting token and check if it exits
  let token;

  if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token || token === 'null') {
    return next(
      new ApiError('You are not logged in. Please log in to get access.', 401),
    );
  }
  // 2) Verification token
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new ApiError(
        'The user that belongs to the current token does no longer exists',
        401,
      ),
    );
  }
  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new ApiError('User recently changed password! Please log in again.', 401),
    );
  }

  // Grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors!
exports.isLoggetIn = async (req, res, next) => {
  try {
    if (req.cookies.accessToken) {
      // 1) verify token
      const decoded = jwt.verify(
        req.cookies.accessToken,
        process.env.JWT_SECRET_KEY,
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a logged in user
      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

// Authorization layer
exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError('You do not have permission to perform this action', 403),
      );
    }
    next();
  });

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ApiError('There is no user with email address.', 404));
  }
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new ApiError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'Token sent to email!',
  });
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new ApiError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3) Update changePasswordAt property for the user

  // 4) Log the user in, send accessToken
  createSendToken(user, 200, req, res);
});

exports.updatePassword = asyncHandler(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user._id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new ApiError('Your current password is wrong.', 401));
  }
  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4) Log user in, send access token
  createSendToken(user, 200, req, res);
});
