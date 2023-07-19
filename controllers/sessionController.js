const User = require('../models/schema');
const Session = require('../models/session'); // Update the import statement
const moment = require('moment');

exports.getPreviousSessionsAttendance = async (req, res) => {
  try {
    const badgeID = parseInt(req.params.badgeID);

    if (isNaN(badgeID)) {
      return res.status(400).json({ error: 'Invalid badge ID' });
    }

    const user = await User.findOne({ badgeID });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const totalSessionsAlloted = user.sessions.length;
    const totalSessionsAttended = user.sessions.filter(({ attended }) => attended).length;
    const attendancePercentage = (totalSessionsAlloted > 0)
      ? (totalSessionsAttended / totalSessionsAlloted) * 100
      : 0;

    const previousSessions = await Promise.all(
      user.sessions.map(async ({ session, attended }) => {
        const sessionID = session;
        const sessionInfo = await Session.findById(sessionID);

        if (!sessionInfo) {
          return null; // If session not found, skip this session
        }

        const { sessionLocation, sessionDate } = sessionInfo;
        const formattedDate = sessionDate ? sessionDate.toISOString().split('T')[0] : null;
        const day = sessionDate ? sessionDate.toLocaleDateString('en-US', { weekday: 'long' }) : null;

        return {
          location: sessionLocation,
          date: formattedDate,
          day: day,
          attended,
        };
      })
    );

    // Filter out null values from previousSessions array (for sessions not found)
    const filteredPreviousSessions = previousSessions.filter(session => session !== null);

    res.json({
      name: `${user.firstName} ${user.surname}`,
      designation: user.rank,
      attendancePercentage,
      totalSessionsAttended,
      totalSessionsAlloted,
      previousSessions: filteredPreviousSessions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
