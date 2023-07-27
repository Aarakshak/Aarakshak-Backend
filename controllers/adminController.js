const User = require('../models/schema');
const Session = require('../models/session');
const Admin = require('../models/adminModel');

const dotenv = require('dotenv');
dotenv.config()
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const secretKey = crypto.randomBytes(64).toString('hex');

const nodemailer = require('nodemailer');

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

      const {emailId, password} = req.body;
      let admin = await Admin.findOne({ emailId, password });
  
      if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      if (password !== admin.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
        const newOTP = generateOTP();
        admin.otp = newOTP;
        admin.otpExpiration = Date.now() + 5 * 60 * 1000;
  
        await sendOTPByEmail(emailId, newOTP);
      
        admin = await admin.save();
  
      res.json({ message: 'OTP sent successfully', adminID: admin.adminId });
    }catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  
  exports.verifyOTP = async (req, res) => {
    try {
      let {adminID, otp} = req.body;
      
      const admin = await Admin.findOne({ adminId: adminID });
      if(!admin)
      {
        return res.status(404).json({error : 'Admin not found'})
      }
  
      if(admin.otp !== otp || Date.now() > admin.otpExpiration)
      {
        return res.status(401).json({error: 'Invalid otp'});
      }
  
      admin.otp = undefined;
      admin.otpExpiration = undefined;
  
      await admin.save();
      const token = jwt.sign(
        { emailId: admin.emailId, adminId: admin.adminId }, 
        secretKey,
        {
          expiresIn: '1d', 
        }
      );
      admin.jwtToken = token;
      await admin.save();
      res.json({ token, adminId: admin.adminId });
    }catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
  }
};

exports.addUserByAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const admin = await Admin.findOne({ adminId: adminId });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    const { badgeID, firstName, surname, password, rank, profilePic, location, zone, sub_division, police_station, phoneNo, emailId, gender, reportsTo } = req.body;

    const existingUser = await User.findOne({ $or: [{ badgeID }, { emailId }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User with the same badge ID or email ID already exists' });
    }
    const user = new User({
      badgeID,
      firstName,
      surname,
      password,
      rank,
      profilePic,
      location,
      zone,
      sub_division,
      police_station,
      phoneNo,
      emailId,
      gender,
      reportsTo,
    });
    await user.save();
    res.json({ message: 'User added successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateUserByAdmin = async (req, res) => {
  try{
    const {adminId, badgeID} = req.params;

    const user = await User.findOne({badgeID});
    if(!user) {
      return res.status(404).json({error: 'User not found'});
    }

    const fields = req.body;

    for(const key in fields) {
      if(Object.hasOwnProperty.call(fields, key)) {
        user[key] = fields[key];
      }
    }

    await user.save();

    res.json({message: 'User information updated successfully'})
  } catch (error) {
    console.error(error);
    res.status(500).json({error: 'Server error'});
  }
}

exports.deleteUser = async (req, res) => {
  try {
    const {adminId, badgeID} = req.params;
    const user = await User.findOne({ badgeID});

    if(!user) {
      return res.status(404).json({error: 'User not found'});
    }

    await user.deleteOne({badgeID});

    res.json({message : 'User deleted successfully'});
  } catch(error) {
    console.error (error);
    res.status(500).json({error : 'Server error'});
  }
};

function generateCheckPoints(startTime, endTime, numCheckPoints){
  const randomCheckpoints = [];
  const startTimeStamp = new Date(startTime).getTime();
  const endTimeStamp = new Date(endTime).getTime();
  const interval = (endTimeStamp - startTimeStamp)/numCheckPoints;

  for(let i = 0; i<numCheckPoints; i++)
  {
    const randomTime = startTimeStamp + i * interval + Math.random() * interval;
    randomCheckpoints.push({ timestamp: new Date(randomTime) });
  }
  return randomCheckpoints;
}

exports.addSessionByAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { sessionID, sessionLocation, sessionLocation2,sessionDate, startTime, endTime,  latitude, longitude  } = req.body;


    const admin = await Admin.findOne({ adminId : adminId });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const numCheckpoints =  10;
    const randomCheckpoints = generateCheckPoints(startTime, endTime,numCheckpoints );

    const session = new Session({
      sessionID,
      sessionLocation,
      sessionLocation2,
      sessionDate,
      startTime,
      endTime,
      latitude,
      longitude ,
      checkpoints: randomCheckpoints
    });

    await session.save();

    res.json({ message: 'Session added successfully', sessionId: sessionID });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.assignUsersToSession = async (req, res) => {
  try {
    const { adminId} = req.params;
    const { sessionId, userIds } = req.body;

    const admin = await Admin.findOne({ adminId : adminId });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const session = await Session.findOne({ sessionID: sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const users = await User.find({ badgeID: { $in: userIds } });

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'Users not found' });
    }
   
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    for (const user of users) {
      if (user.sessions.some((userSession) => userSession.session === sessionId)) {
        continue; // Skip if already assigned
      }

      user.sessions.push({
        session: session._id,
        attended: false, 
      });
      
      user.reportsTo = adminId;

      await user.save();
    }

    res.json({ message: 'Users assigned to sessions successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllIssues = async (req, res) => {
  try {
    const {adminId} = req.params;

    const admin = await Admin.findOne({adminId: adminId});
    if(!admin) {
      return res.status(404).json({error: 'Admin not found'});
    }
    const usersWithIssues = await User.find({});

    const allIssues = usersWithIssues.reduce((issuesList, user) => {
      if (user.issues && Array.isArray(user.issues)) {
        // If the user has issues, iterate through each issue
        user.issues.forEach((issue) => {
          // Add the issue to the issuesList array
          issuesList.push(issue);
        });
      }
      return issuesList;
    }, []);

    res.json(allIssues);
  }catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  } 
};
exports.addUserNotificationByAdmin = async (req, res) => {
  try {
    const { adminId,badgeID } = req.params;
    const { type, message } = req.body;

    const user = await User.findOne({ badgeID });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const notificationID = await generateNewNotificationId();

    const notification = {
      notificationID :notificationID,
      type : type,
      message: message,
      timestamp: Date.now(),
      read: false,
    };
    user.notifications.push(notification);
    await user.save();

    res.json({ message: 'Notification added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

async function generateNewNotificationId() {
  try {
    const lastNotification = await User.findOne().sort({ 'notifications.notificationID': -1 });
    let newNotificationId = 1;

    if (lastNotification && lastNotification.notifications.length > 0) {
      newNotificationId = lastNotification.notifications[0].notificationID + 1;
    }

    return newNotificationId;
  } catch (error) {
    console.error('Error generating notificationId', error);
    throw error;
  }
}

// const Admin = require('../models/adminModel');

exports.createAdmin = async (req, res) => {
  try {
    const { adminId, firstName, emailId, password, designation } = req.body;
    const existingAdmin = await Admin.findOne({ $or: [{ adminId }, { emailId }] });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin with the same adminId or emailId already exists' });
    }

    const admin = new Admin({
      adminId,
      firstName,
      emailId,
      password,
      designation,
    });

    await admin.save();

    res.json({ message: 'Admin user created successfully', admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};




