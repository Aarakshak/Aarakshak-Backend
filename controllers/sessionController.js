const User = require("../schema");


exports.getPreviousSessionsAttendance = async (req, res) => {
    try{
        const badgeID = parseInt(req.params.badgeID);

        if (isNaN(badgeID)) {
            return res.status(400).json({ error: 'Invalid badge ID' });
        }
      
        const user = await User.findOne({ badgeID });
      
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const totalSessionsAlloted = user.sessions.length;
        const totalSessionsAttended = user.sessions.filter(({attended}) => attended).length;
        const attendancePercentage = (totalSessionsAlloted/ totalSessionsAttended)*100;

        const previousSessions =  user.sessions.map(({session, attended}) => {
            const {sessionLocation, sessionDate} = session;
            return {
                location : sessionLocation,
                date : sessionDate.toISOString().split('T')[0],
                day : sessionDate.toLocaleDateString('en-US', {weekday : 'long'}),
                attended,
            };
        });
        res.json({ name: `${user.firstName} ${user.surname}`,
        designation: user.rank,
        attendancePercentage,
        totalSessionsAttended, 
        totalSessionsAlloted, 
        previousSessions});
    } catch(error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};