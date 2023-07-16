const mongoose = require('mongoose');
const { Schema } = mongoose;


const URL = 'mongodb+srv://chinmay_1:HRabrVuwwJOFKpBl@cluster0.8lxkr0v.mongodb.net/cluster0?retryWrites=true&w=majority'
mongoose.connect(URL, { useNewUrlParser: true });
const userSchema = new mongoose.Schema({
    badgeID: {
        type: Number,
        required: 'Badge ID can not be empty',
        unique: true
    },
    firstName: {
        type: String,
        required: 'Name can not be empty',
    },
    surname: {
        type: String,
        required: 'Name can not be empty',
    },
    rank: {
        type: String,
        required: 'Rank can not be empty',
    },
    profilePic: {
        type: String,
        required: 'Photo can not be empty',
    },
    location: {
        type: String,
        required: 'Location can not be empty',
    },
    zone : {
        type: String,
        
    },
    sub_division : {
        type: String,
    },
    police_station : {
        type: Number,
    },
    phoneNo: {
        type: String,
        required: 'PhoneNo can not be empty'
    },
    emailId: {
        type: String,
        required: 'EmailId can not be empty'
    },
    gender: {
        type: String,
        required: 'Gender can not be empty',
    },
    sessions: [{
        session: {
            sessionID: {
                type: Number,
                required: 'Session ID can not be empty',
            },
            sessionLocation: {
                type: String,
                required: 'Location can not be empty',
            },
            sessionLocation2: {
                type: String,
                required: 'Location can not be empty',
            },
            sessionDate: {
                type: Date,
                required: 'Date can not be empty',
            },
            startTime: {
                type: Date,
                required: 'Can not be empty',
            },
            endTime: {
                type: Date,
                required: 'Can not be empty',
            },
        },
        attended: {
            type: Boolean,
            default: false
        }
    }],
    issues: [{
        issue: {
            badgeID: {
                type: Number,
                ref: 'User',
                required: 'Badge ID can not be empty',
            },
            issueID: {
                type: Number,
                required: 'ID cannot be empty',

            },
            issueText: {
                type: String,
                required: 'Issue can not be empty',
            },
            raised: {
                type: Date,
                required: 'Enter raised date',

            },
            resolved: Date

        },
        pertaining: Boolean
    }],
    sos :[{
        sosId: {
            type : Number,
            required: 'sosId cannot be empty'
        },
        desc : {
            type: String,
            required: 'Cannot bt empty'
        }
    }],
    reportsTo: Number,


});

const User = mongoose.model("User", userSchema);
module.exports = User;