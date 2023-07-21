const User = require('../models/schema');
const Session = require('../models/session')
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const secretKey = crypto.randomBytes(64).toString('hex');

const formatTime = (time) => {
  return new Date(time).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

exports.loginUser = async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const user = await User.findOne({ emailId, password });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (password !== user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If the password is valid, generate a JWT token
    const token = jwt.sign(
      { emailId: user.emailId, badgeID: user.badgeID }, // Include badgeID in the payload
      secretKey,
      {
        expiresIn: '1h', // Set the expiration time for the token
      }
    );

    user.jwtToken = token;
    await user.save();

    // Return the token and badgeID to the client
    res.json({ token, badgeID: user.badgeID });
  }catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createIssue = async (req, res) => {
  try {
    const badgeID = parseInt(req.params.badgeID);

    if (isNaN(badgeID)) {
      return res.status(400).json({ error: 'Invalid badge ID' });
    }

    const user = await User.findOne({ badgeID });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const lastIssue = user.issues[user.issues.length - 1];
    const issueID = lastIssue ? lastIssue.issue.issueID + 1 : 1;


    const { issueText } = req.body;

    const issue = {
      issue: {
        badgeID: user.badgeID,
        issueID,
        issueText,
        raised: new Date(),
        resolved: null, 
      },
      pertaining: true,
    };
    user.issues.push(issue);

    await user.save();

    res.json(issue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.getCurrentSession = async (req, res) => {
  try {
    const badgeID = parseInt(req.params.badgeID);

    if (isNaN(badgeID)) {
      return res.status(400).json({ error: 'Invalid badge ID' });
    }

    const user = await User.findOne({ badgeID }).populate({
      path: 'sessions.session',
      model: 'Session',
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentDate = new Date().toISOString().split('T')[0];

    const currentSession = user.sessions.find(({ session }) => {
      return session.sessionDate.toISOString().split('T')[0] === currentDate;
    });

    if (!currentSession) {
      return res.status(404).json({ error: 'No current session found' });
    }

    const { sessionLocation, sessionLocation2, startTime, endTime, checkpoints } = currentSession.session;

    const response = {
      location1: sessionLocation,
      location2: sessionLocation2,
      reportingTo: user.reportsTo,
      checkInTime: startTime,
      checkOutTime: endTime,
      checkpointCount: checkpoints.length,
      checkpoints,
      date: currentDate,
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.getUserByBadgeID = async (req, res) => {
  try {
    const badgeID = parseInt(req.params.badgeID);

    if (isNaN(badgeID)) {
      return res.status(400).json({ error: 'Invalid badge ID' });
    }

    const user = await User.findOne({ badgeID });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { rank, firstName, surname, sessions } = user;
    const sessionInfo = sessions.map(({ session }) => ({
      location: session.sessionLocation,
      location2: session.sessionLocation2,
      date: session.sessionDate,
      startTime:formatTime( session.startTime),
      endTime: formatTime(session.endTime),
    }));

    const response = {
      rank,
      badgeID,
      firstName,
      surname,
      sessions: sessionInfo,
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};