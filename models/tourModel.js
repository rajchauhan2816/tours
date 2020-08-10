const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [ true, 'A tour must have a name' ],
			unique: true,
			trim: true,
			maxlength: [ 40, 'A tour name must have less than or equal 40 chracters' ],
			minlength: [ 10, 'A tour name must have greater than or equal 40 chracters' ]
			// validate: [validator.isAlpha,'Tour name must only contain Characters']
		},
		slug: String,
		duration: {
			type: Number,
			required: [ true, 'A tour must have a duration' ]
		},
		maxGroupSize: {
			type: Number,
			required: [ true, 'A tour must have a group size' ]
		},
		difficulty: {
			type: String,
			required: [ true, 'A tour must have a Difficulty' ],
			enum: {
				values: [ 'easy', 'medium', 'difficult' ],
				message: 'Difficulty is either : easy, medium, difficult'
			}
		},
		ratingsAverage: {
			type: Number,
			default: 4.5,
			min: [ 1, 'Ratings must be above 1.0' ],
			max: [ 5, 'Ratings must be below 5.0' ]
		},
		ratingsQuantity: {
			type: Number,
			default: 0
		},
		price: {
			type: Number,
			required: [ true, 'A tour must have a price' ]
		},
		priceDiscount: {
			type: Number,
			validate: {
				validator: function(val) {
					//this only points to current Document on NEW DOCUMENT CREATION
					return val < this.price; // 100 < 200
				},
				message: 'Discount Price ({VALUE}) should be below Regular Price'
			}
		},
		summary: {
			type: String,
			trim: true,
			required: [ true, 'A tour must have a Description' ]
		},
		description: {
			type: String,
			trim: true
		},
		imageCover: {
			type: String,
			required: [ true, 'A tour must have a Cover' ]
		},
		images: [ String ],
		createdAt: {
			type: Date,
			default: Date.now(),
			select: false
		},
		startDates: [ Date ],
		secretTour: {
			type: Boolean,
			default: false
		},
		startLocation: {
			//GeoJSON
			type: {
				type: String,
				default: 'Point',
				enum: [ 'Point' ]
			},
			coordinates: [ Number ],
			address: String,
			description: String
		},
		locations: [
			{
				type: {
					type: String,
					default: 'Point',
					enum: [ 'Point' ]
				},
				coordinates: [ Number ],
				address: String,
				description: String,
				day: Number
			}
		]
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true }
	}
);

tourSchema.virtual('durationWeeks').get(function() {
	return this.duration / 7;
});

// DOCUMENT MIDDLE WARE: runs before .save() , .create()
tourSchema.pre('save', function(next) {
	this.slug = slugify(this.name, { lower: true });
	next();
});

// tourSchema.pre('save',function(next){
//     console.log('Will save Document...');
//     next();
// })

// tourSchema.post('save',function(doc,next){
//     console.log(doc);
//     next();
// });

// QUERY MIDDLE WARE
// tourSchema.pre('find',function(next){
tourSchema.pre(/^find/, function(next) {
	this.find({ secretTour: { $ne: true } });
	this.start = Date.now();
	next();
});

tourSchema.post(/^find/, function(docs, next) {
	console.log(`Query took ${Date.now() - this.start} ms`);
	next();
});

//AGGREGATION MIDDLEWARE

tourSchema.pre('aggregate', function(next) {
	this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
	console.log(this.pipeline());
	next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
