const morgan = require('morgan');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();


// 1) GLOBAL MIDDLEWARES
// Set security HTTP header
app.use(helmet());
// Development Logging
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));

}
// LIMIT requests from same IP
const limiter = rateLimit({
	max: 100,
	windowMs: 60 * 60 * 1000,
	message: 'Too many request from this IP, please try again in an hour!'
});
app.use('/api', limiter);

//Body parser, reading data from the req.body
app.use(express.json({ limit: '10kb' }));

// Data Sanitizaion against NoSQL query injection
app.use(mongoSanitize());

// Data Sanitaization against XSS
app.use(xss());

//Prevent Parameter Pollution
app.use(hpp({
	whitelist: [
		'duration',
		'ratingsQuantity',
		'ratingsAverage',
		'maxGroupSize',
		'difficulty',
		'price'

	]
}));

//Serving static files
app.use(express.static(`${__dirname}/public`));

//Test Middleware
app.use((req, res, next) => {
	req.requestTime = new Date().toISOString();
	// console.log(req.headers);
	next();
})


// 3) ROUTER
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
	next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;