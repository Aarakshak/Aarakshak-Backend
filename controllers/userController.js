const User = require('../schema');


const formatTime = (time) => {
  return new Date(time).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
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