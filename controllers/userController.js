const User = require('../models/schema');
const Session = require('../models/session')

const formatTime = (time) => {
  return new Date(time).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
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

    // Generate the issueID
    const lastIssue = user.issues[user.issues.length - 1];
    const issueID = lastIssue ? lastIssue.issue.issueID + 1 : 1;

    // Extract the relevant data from the request body
    const { issueText } = req.body;

    // Create a new issue object
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

    const user = await User.findOne({ badgeID });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentDate = new Date().toISOString().split('T')[0];

    const currentSession = user.sessions.find(({ session }) => {
      const sessionDate = session.sessionDate.toISOString().split('T')[0];
      return sessionDate === currentDate;
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