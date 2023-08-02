const mongoose = require('mongoose');
const { Schema } = mongoose;
const validator =  require('validator')

const userSchema = new Schema({
  badgeID: {
    type: Number,
    required: 'Badge ID cannot be empty',
    unique: true
  },
  firstName: {
    type: String,
    required: 'Name cannot be empty',
  },
  surname: {
    type: String,
    required: 'Name cannot be empty',
  },
  password : {
    type: String,
    default : '12345'
  },
  rank: {
    type: String,
    required: 'Rank cannot be empty',
  },
  profilePic: {
    type: String,
    required: 'Photo cannot be empty',
  },
  policeStationId: {
    type: Number, 
  },
  phoneNo: {
    type: String,
    required: 'PhoneNo cannot be empty'
  },
  emailId: {
    type: String,
    unique: true,
  },
  gender: {
    type: String,
    required: 'Gender cannot be empty',
  },
  sessions: [{
    session: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
    },
    attended: {
      type: Boolean,
      default: false,
    },
    attendedCheckpoints: {
      type: Number,
      default: 0,
    },
    totalCheckpoints: {
      type: Number,
      default: 0,
    },
    lastAttended: {
      type: Boolean,
      default: false,
    },
    lastCheckpointTimestamp: {
      type: Date,
    },
    lastCheckpointLocation: {
      type: String,
    },
    dutyStarted: {
      type: Boolean,
      default: false,
    },
    dutyStartTime: {
      type: Date,
    },
    dutyEnded: {
      type: Boolean,
      default: false,
    },
    dutyEndTime: {
      type: Date,
    }
  }],
  issues: [{
    issue: {
      badgeID: {
        type: Number,
        ref: 'User',
        required: 'Badge ID cannot be empty',
      },
      issueID: {
        type: Number,
        required: 'ID cannot be empty',
      },
      title : {
        type: String,
        required: 'Title cannot be empty'
      },
      issueText: {
        type: String,
        required: 'Issue cannot be empty',
      },
      raised: {
        type: Date,
        required: 'Enter raised date',
      },
      resolved: {
       type: Date,
      },
      latitude:{
        type : Number,
      },
      longitude:{
        type : Number,
      }        
    },
    pertaining: Boolean,
  }],
  otp: {
    type: String,
    required: false, 
  },
  otpExpiration: {
    type: Date,
    required: false,
  },
  reportsTo:{
    type : Number
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  notifications: [
    {
      notificationID: {
        type: Number,
        required: true,
      },
      title :{
        type: String,
        required : true,
      },
      type: {
        type: String,
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
      timestamp : {
        type: Date,
        default: Date.now,
      },
      read: {
        type: Boolean,
        default : false,
      },
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
