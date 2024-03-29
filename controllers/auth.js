const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../models/User");

// @desc Register user 
// @route POST /api/v1/auth/register
// @access Public
exports.register = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body;
    
    const user = await User.create({
        name,
        email,
        password
    });

    sendTokenResponse(user, 200, res);
});

// @desc Login user
// @route POST /api/v1/auth/login
// @access Public
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorResponse('Please provide an email and password'));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next(
            new ErrorResponse('Invalid credentials', 401)
        );
    }

    const isMatched = await user.matchPassword(password);

    if (!isMatched) {
        return next(
            new ErrorResponse('Invalid credentials', 401)
        );
    }

    sendTokenResponse(user, 200, res);

});

// @desc : Get current logged in user
// @route  : GET /api/v1/auth/me
// @access : Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

// @desc  Log user out/clear cookie
// @route  GET /api/v1/auth/logout
// @access Private
exports.logout = asyncHandler(async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly:  true
    });

    res.status(200).json({
        success: true,
        data: {}
    });
});


const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    // Create cookie
    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
    }

    // In production
    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token
        });

}