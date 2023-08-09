const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
    adminId: {
        type: Number,
        required: true,
        unique: true,
    },
    policeStation: [{
        policeStationId: {
            type: Number
        },
    }],
    firstName: {
        type : String,
        required: true,
    }, 
    emailId: {
        type : String,
        required: true,
    },
    password: {
        type: String,
        default: '12345'
    },
    designation : {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: false, 
      },
    otpExpiration: {
        type: Date,
        required: false,
      },
});
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;