const User = require('../schema');

exports.getUpcomingSession = async (req, res) => {
    try {
      const badgeID = parseInt(req.params.badgeID);
  
      if (isNaN(badgeID)) {
        return res.status(400).json({ error: 'Invalid badge ID' });
      }
  
      const user = await User.findOne({ badgeID });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const currentDate = new Date();

      const upcomingSessions = user.sessions.filter(({session}) =>{
        const sessionDate = new Date(session.sessionDate);
        return sessionDate > currentDate;
      })

      const {firstName, surname, rank} = user;
      const response = {
        name: `${firstName} ${surname}`,
        rank,
        upcomingSessions: upcomingSessions.map(({session}) => ({
          date : new Date(session.sessionDate).toLocaleDateString(),
          day : new Date(session.sessionDate).toLocaleTimeString('en-US', {
            weekday: 'long',
          }),
          location1: session.sessionLocation,
          location2: session.sessionLocation2,
        })),
      }
  
      res.json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  };