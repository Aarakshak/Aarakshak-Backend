const User = require("../schema");

exports.getProfileOfUserByBadgeID = async (req, res) => {
    try{
        const badgeID = parseInt(req.params.badgeID);

        if (isNaN(badgeID)) {
            return res.status(400).json({ error: 'Invalid badge ID' });
        }
      
        const user = await User.findOne({ badgeID });
      
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
        picture : user.profilePic,
        name: `${user.firstName} ${user.surname}`,
        policeId: user.badgeID,
        mobileNo: user.phoneNo,
        email: user.emailId,});
    } catch(error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};