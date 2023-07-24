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


exports.addSessionByAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { sessionID, sessionLocation, sessionLocation2,sessionDate, startTime, endTime } = req.body;


    const admin = await Admin.findOne({ adminId : adminId });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }


    const session = new Session({
      sessionID,
      sessionLocation,
      sessionLocation2,
      sessionDate,
      startTime,
      endTime,
    });

    await session.save();

    res.json({ message: 'Session added successfully', sessionId: sessionID });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};