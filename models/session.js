const mongoose = require('mongoose');
const { Schema } = mongoose;

const sessionSchema = new Schema({
  sessionID: {
    type: Number,
    required: 'Session ID cannot be empty',
    unique: true
  },
  sessionLocation: {
    type: String,
    required: 'Location cannot be empty',
  },

  sessionDate: {
    type: Date,
  },
  startTime: {
    type: Date,
    required: 'Start time cannot be empty',
  },
  endTime: {
    type: Date,
    required: 'End time cannot be empty',
  },
  endDate: {
    type: Date,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  createdBy:{
    type: Number
  },
  checkpoints: [{
    timestamp: Date,
    isLocationCorrect: Boolean,
  }],
  description: {
    type: String,
  },
  radius : {
    type: Number,
  },
  emergency: {
    type: Boolean
  }
});

module.exports = mongoose.model('Session', sessionSchema);
// 