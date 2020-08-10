const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');


const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) {
            newObj[el] = obj[el];
        }
    })
    return newObj;
}
exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find();

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    });
});

exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) create error if POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password updates. Please use /updateMyPassword', 400));
    }
    // 2) Filter out unwanted fields names that are not allowed to be updated
    const filterBody = filterObj(req.body, 'name', 'email');
    // 3) Update the user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, { new: true, runValidators: true });
    res.status(200).json({
        status: "success",
        datae: {
            user: updatedUser
        }
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: "success",
        data: null
    })
})

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'Error',
        message: "This ROute is not yet defined"
    });
};

exports.getUser = (req, res) => {
    res.status(500).json({
        status: 'Error',
        message: "This ROute is not yet defined"
    });
};

exports.updateUser = (req, res) => {
    res.status(500).json({
        status: 'Error',
        message: "This ROute is not yet defined"
    });
};

exports.deleteUser = (req, res) => {
    res.status(500).json({
        status: 'Error',
        message: "This Route is not yet defined"
    });
};