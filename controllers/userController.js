const User = require('../models/schema');
const Session = require('../models/session')

const dotenv = require('dotenv');
dotenv.config()
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const secretKey = crypto.randomBytes(64).toString('hex');

const nodemailer = require('nodemailer');

const formatTime = (time) => {
  return new Date(time).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

function generateOTP() {
 const digits = '0123456789';
 let otp = '';
 for(let i = 0; i<6; i++)
 {
  otp += digits[Math.floor(Math.random()*10)];
 }
 return otp;
}

async function sendOTPByEmail(email, otp)  {
  
  const transporter = nodemailer.createTransport({
    service :'gmail',
    auth : {
      user: process.env.email,
      pass: process.env.pass
    }
});

  const mailOptions = {
    from : process.env.email,
    to : email,
    subject: 'OTP Verification',
    text : `Your OTP is: ${otp}`
  };
  try{
    await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully');
  } catch(error) {
    console.log('Error sending OTP email', error);
  }
}


exports.loginUser = async (req, res) => {
  try {
    const { emailId, password, otp } = req.body;
    let user = await User.findOne({ emailId, password });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (password !== user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
      const newOTP = generateOTP();
      user.otp = newOTP;
      user.otpExpiration = Date.now() + 5 * 60 * 1000;

      await sendOTPByEmail(emailId, newOTP);
    
      user = await user.save();

    // Return the token and badgeID to the client
    res.json({ message: 'OTP sent successfully', badgeID: user.badgeID });
  }catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    let {badgeID, otp} = req.body;
    let user = await User.findOne({badgeID});
    if(!user)
    {
      return res.status(404).json({error : 'User not found'})
    }

    if(user.otp !== otp || Date.now() > user.otpExpiration)
    {
      return res.status(401).json({error: 'Invalid otp'});
    }

    const imageUrl = user.profilePic; 

    user.otp = undefined;
    user.otpExpiration = undefined;

    user = await user.save();
    const token = jwt.sign(
      { emailId: user.emailId, badgeID: user.badgeID }, // Include badgeID in the payload
      secretKey,
      {
        expiresIn: '1d', // Set the expiration time for the token
      }
    );
    user.jwtToken = token;
    await user.save();

    res.json({ token, badgeID: user.badgeID , imageUrl});
  }catch (error) {
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