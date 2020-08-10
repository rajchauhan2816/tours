const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const CatchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN
	});
};

const createSendToken = (user, statusCode, res) => {
	const token = signToken(user._id);
	const cookieOptions = {
		expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
		httpOnly: true
	};
	if (process.env.NODE_ENV === 'production') {
		cookieOptions.secure = true;
	}
	res.cookie('jwt', token, cookieOptions)
	// Remove the password from the output
	user.password = undefined;
	res.status(statusCode).json({
		status: 'success',
		token,
		data: {
			user
		}
	});
}

exports.signup = CatchAsync(async (req, res, next) => {
	const newUser = await User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm
	});

	// const newUser = await User.create(req.body);

	createSendToken(newUser, 201, res);
});

exports.login = CatchAsync(async (req, res, next) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return next(new AppError('Please Provide email and password', 400));
	}

	const user = await User.findOne({ email }).select('+password');

	if (!user || !await user.correctPassword(password, user.password)) {
		return next(new AppError('Incorrect Email or Password', 401));
	}
	createSendToken(user, 200, res);
});

exports.protect = CatchAsync(async (req, res, next) => {
	// 1) Getting the token check if its exist
	let token;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		token = req.headers.authorization.split(' ')[1];
	}

	if (!token) {
		return next(new AppError('You are not logged in, Please log in to get access', 401));
	}
	// 2) verifying the token, Verification token
	const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

	// 3) check if user still exist
	const currentUser = await User.findById(decoded.id);
	if (!currentUser) {
		return next(new AppError('The user belonging to this token does no longer eist', 401));
	}

	// 4) check if user changed password after token is issued
	if (currentUser.changedPasswordAfter(decoded.iat)) {
		return next(new AppError('User recently changed Password, Please log in again', 401));
	}

	// GRANT ACCESS TO PROTECTED ROUTE
	req.user = currentUser;
	next();
});

exports.restrictTo = (...roles) => {
	return (req, res, next) => {
		//roles is an array
		// roles ['admin','lead-guide']
		if (!roles.includes(req.user.role)) {
			return next(new AppError('You do not have permission to perform this action', 403));
		}

		next();
	};
};

exports.forgetPassword = CatchAsync(async (req, res, next) => {
	// 1) Get user based on posted email
	const user = await User.findOne({ email: req.body.email });

	if (!user) {
		return next(new AppError('There is no user with email address', 404));
	}
	// 2) Generate the random reset token

	const resetToken = user.createPasswordResetToken();
	await user.save({ validateBeforeSave: false });

	//3) send it to user email
	const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

	const message = `Forget your password? Submit a patch request with your new password and passwordConfirm to : ${resetURL}.\n if you didn't forget your password, please ignore this email`;
	try {
		await sendEmail({
			email: user.email,
			subject: 'Your Password reset token valid for (10min)',
			message
		});

		res.status(200).json({
			status: 'success',
			message: 'Token Sent to email'
		});
	} catch (err) {
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save({ validateBeforeSave: false });
		return next(new AppError('There was an error sending the email.Try again Later', 500));
	}
});

exports.resetPassword = CatchAsync(async (req, res, next) => {
	// 1) Get user Based on Token
	const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

	const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
	// 2) If token is not expired, and there is user, set the new password
	if (!user) {
		return next(new AppError('Token is Invalid or has Expirex', 400));
	}
	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;
	await user.save();
	// 3) update changedPasswordAt property for the user

	// 4)  log the user in, Send the JWT
	createSendToken(user, 200, res);
});


exports.updateMyPassword = CatchAsync(async (req, res, next) => {
	// 1) get the user from collection
	const { passwordCurrent, password, passwordConfirm } = req.body;
	const user = await User.findById(req.user.id).select('+password');

	// 2) check if Password is Correct

	if (!await user.correctPassword(passwordCurrent, user.password)) {
		return next(new AppError('Password is Incorrect, Please try again!', 401));
	}

	// 3) if passwrd is correct Update the password
	user.password = password;
	user.passwordConfirm = passwordConfirm;
	await user.save();
	//4)Log user in, send jwt
	createSendToken(user, 200, res);

});
