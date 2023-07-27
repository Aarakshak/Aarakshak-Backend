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
  // sessionLocation2: {
  //   type: String,
  //   required: 'Location cannot be empty',
  // },
  sessionDate: {
    type: Date,
    required: 'Date cannot be empty',
  },
  startTime: {
    type: Date,
    required: 'Start time cannot be empty',
  },
  endTime: {
    type: Date,
    required: 'End time cannot be empty',
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  checkpoints: [{
    timestamp: Date,
    isLocationCorrect: Boolean,
  }],
  description: {
    type: String,
  }
});

module.exports = mongoose.model('Session', sessionSchema);
