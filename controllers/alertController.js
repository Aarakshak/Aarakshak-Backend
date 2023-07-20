const User = require('../models/schema'); // Import the User model
const Session = require('../models/session'); 
exports.getUpcomingSession = async (req, res) => {
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

    const currentDate = new Date();

    const upcomingSessions = user.sessions.filter(({ session }) => {
      const sessionDate = new Date(session.sessionDate);
      return sessionDate > currentDate;
    });


    if (upcomingSessions.length === 0) {
      return res.json({
        name: `${user.firstName} ${user.surname}`,
        rank: user.rank,
        upcomingSessions: [],
        message: 'No upcoming sessions found.',
      });
    }
    const response = {
      name: `${firstName} ${surname}`,
      rank: user.rank,
      upcomingSessions: upcomingSessions.map(({ session }) => ({
        
        date: new Date(session.sessionDate).toISOString(), // Convert date to ISO string
        day: new Date(session.sessionDate).toLocaleDateString('en-US', { weekday: 'long' }),
        location1: session.sessionLocation,
        location2: session.sessionLocation2,
      })),
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
