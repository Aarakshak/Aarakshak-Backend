const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
    adminId: {
        type: Number,
        required: true,
        unique: true,
    },
    firstName: {
        type : String,
        required: true,
        unique: true,
    }, 
    emailId: {
        type : String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    designation : {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: false, // You can set it to true if you want OTP to be always present for verification
      },
      otpExpiration: {
        type: Date,
        required: false,
      },
});
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;