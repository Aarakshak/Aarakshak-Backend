const User = require('../models/schema');
const Session = require('../models/session');
const Admin = require('../models/adminModel');

const dotenv = require('dotenv');
dotenv.config()
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const secretKey = crypto.randomBytes(64).toString('hex');
var SqlString = require('sqlstring');

const nodemailer = require('nodemailer');

function generateOTP() {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < 6; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

async function sendOTPByEmail(email, otp) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.email,
            pass: process.env.pass
        }
    });
    const mailOptions = {
        from: process.env.email,
        to: email,
        subject: 'OTP Verification',
        text: `Your OTP is: ${otp}`
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log('OTP email sent successfully');
    } catch (error) {
        console.log('Error sending OTP email', error);
    }
}

exports.loginUser = async(req, res) => {
    try {

        const { emailId, password } = req.body;
        let admin = await Admin.findOne({ emailId, password });

        if (!admin) {
            return res.status(250).json({ error: 'Invalid credentials' });
        }

        if (password !== admin.password) {
            return res.status(250).json({ error: 'Invalid credentials' });
        }
        // const newOTP = generateOTP();
        // admin.otp = newOTP;
        // admin.otpExpiration = Date.now() + 5 * 60 * 1000;

        // await sendOTPByEmail(emailId, newOTP);

        admin = await admin.save();

        res.json({ message: 'Login successfull', adminID: admin.adminId, firstName: admin.firstName });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.verifyOTP = async(req, res) => {
    try {
        let { adminID, otp } = req.body;

        const admin = await SqlString.Admin.findOne({ adminId: adminID });
        if (!admin) {
            return res.status(250).json({ error: 'Admin not found' })
        }

        if (admin.otp !== otp || Date.now() > admin.otpExpiration) {
            return res.status(250).json({ error: 'Invalid otp' });
        }

        admin.otp = undefined;
        admin.otpExpiration = undefined;

        await admin.save();
        const token = jwt.sign({ emailId: admin.emailId, adminId: admin.adminId },
            secretKey, {
                expiresIn: '1d',
            }
        );
        admin.jwtToken = token;
        await admin.save();
        res.json({ token, adminId: admin.adminId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.addUserByAdmin = async(req, res) => {
    try {
        const { adminId } = req.params;
        const admin = await Admin.findOne({ adminId: adminId });
        if (!admin) {
            return res.status(250).json({ error: 'Admin not found' });
        }
        const { badgeID, firstName, surname, rank, profilePic, policeStationId, location, zone, sub_division, police_station, phoneNo, emailId, gender } = req.body;
        const policeStationAllowed = admin.policeStation.some(station => station.policeStationId === policeStationId);

        if (!policeStationAllowed) {
            return res.status(250).json({ error: 'Invalid policeStationId. The admin cannot assign this policeStation to the user.' });
        }

        const existingUser = await User.findOne({ $or: [{ badgeID }, { emailId }] });
        if (existingUser) {
            return res.status(250).json({ error: 'User with the same badge ID or email ID already exists' });
        }
        const user = new User({
            badgeID: badgeID,
            firstName: firstName,
            surname: surname,
            rank: rank,
            profilePic: profilePic,
            policeStationId: policeStationId,
            phoneNo,
            emailId,
            gender,
            reportsTo: adminId,
        });
        await user.save();
        res.json({ message: 'User added successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateUserByAdmin = async(req, res) => {
    try {
        const { adminId, badgeID } = req.params;

        const user = await User.findOne({ badgeID });
        if (!user) {
            return res.status(250).json({ error: 'User not found' });
        }

        const fields = req.body;

        for (const key in fields) {
            if (Object.hasOwnProperty.call(fields, key)) {
                user[key] = fields[key];
            }
        }

        await user.save();

        res.json({ message: 'User information updated successfully' })
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}

exports.deleteUser = async(req, res) => {
    try {
        const { adminId, badgeID } = req.params;
        const user = await User.findOne({ badgeID });

        if (!user) {
            return res.status(250).json({ error: 'User not found' });
        }

        await user.deleteOne({badgeID});

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

function generateCheckPoints(startTime, endTime, numCheckPoints) {
    const randomCheckpoints = [];
    const startTimeStamp = new Date(startTime).getTime();
    const endTimeStamp = new Date(endTime).getTime();
    const interval = (endTimeStamp - startTimeStamp) / numCheckPoints;

    for (let i = 0; i < numCheckPoints; i++) {
        const randomTime = startTimeStamp + i * interval + Math.random() * interval;
        randomCheckpoints.push({ timestamp: new Date(randomTime) });
    }
    return randomCheckpoints;
}

exports.addSessionByAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { sessionLocation, sessionDate, startTime, endTime, latitude, longitude } = req.body;

        const lastSession = await Session.findOne().sort({ sessionID: -1 });
        const sessionID = lastSession ? lastSession.sessionID + 1 : 1;

        const admin = await Admin.findOne({ adminId: adminId });
        if (!admin) {
            return res.status(250).json({ error: 'Admin not found' });
        }

        const sessionDateUTC = new Date(new Date(sessionDate).getTime());
        const startTimeUTC = new Date(new Date(startTime).getTime() );
        const endTimeUTC = new Date(new Date(endTime).getTime());

        const numCheckpoints = 10;
        const randomCheckpoints = generateCheckPoints(startTimeUTC, endTimeUTC, numCheckpoints);

        const session = new Session({
            sessionID,
            sessionLocation,
            sessionDate: sessionDateUTC,
            startTime: startTimeUTC,
            endTime: endTimeUTC,
            latitude,
            longitude,
            createdBy: adminId,
            checkpoints: randomCheckpoints
        });

        await session.save();

        res.json({ message: 'Session added successfully', sessionId: sessionID });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getSessionsByAdmin = async(req, res) => {
    try {
        const { adminId } = req.params;
        const sessions = await Session.find({ createdBy: adminId });

        const currentTime = new Date().getTime();

        if (!sessions || sessions.length === 0) {
            return res.status(250).json({ error: 'No sessions found for this admin' });
        }

        const sessionsOfInterest = sessions.filter(session => {
            const minus = 5.5 * 60 * 60 * 1000;
            const sessionStartTime = session.startTime.getTime() - minus;
            const sessionEndTime = session.endTime.getTime() - minus;
            const twelve = 12 * 60 * 60 * 1000;
            if (sessionEndTime < currentTime) {
                return false; // Exclude sessions that have finished
            } else if (sessionStartTime <= currentTime && currentTime <= sessionEndTime) {
                return true; // Session is in progress
            } else if (sessionStartTime >= currentTime && sessionStartTime - currentTime <= twelve) {
                return true;
            }
        });

        res.json({ sessions: sessionsOfInterest });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};


exports.getAllSessions = async(req, res) => {
    const { adminId } = req.params;
    const admin = await Admin.findOne({ adminId: adminId });
    if (!admin) {
        return res.status(250).json({ error: 'Admin not found' });
    }
    const sess = await Session.find({})
    if (!sess) {
        res.status(404).json({ error: "No sessions found" })
    }

    res.json({ sess })
};


exports.assignUsersToSession = async(req, res) => {
    try {
        const { adminId } = req.params;
        const { sessionId, userIds, description } = req.body;

        const admin = await Admin.findOne({ adminId: adminId });
        if (!admin) {
            return res.status(250).json({ error: 'Admin not found' });
        }

        const session = await Session.findOne({ sessionID: sessionId });
        if (!session) {
            return res.status(250).json({ error: 'Session not found' });
        }

        const users = await User.find({ badgeID: { $in: userIds } });

        if (!users || users.length === 0) {
            return res.status(250).json({ error: 'Users not found' });
        }

        for (const user of users) {
            if (user.sessions.some((userSession) => userSession.session && userSession.session.equals(session._id))) {
                return res.status(250).json({ error: 'Session already assigned to the user' });
            }
        }
        if (!session) {
            return res.status(250).json({ error: 'Session not found' });
        }

        for (const user of users) {
            if (user.sessions.some((userSession) => userSession.session === sessionId)) {
                continue;
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

exports.getAllIssues = async(req, res) => {
    try {
        const { adminId } = req.params;

        const admin = await Admin.findOne({ adminId: adminId });
        if (!admin) {
            return res.status(250).json({ error: 'Admin not found' });
        }
        const usersWithIssues = await User.find({});

        const allIssues = usersWithIssues.reduce((issuesList, user) => {
            if (user.issues && Array.isArray(user.issues)) {
                user.issues.forEach((issue) => {
                    issuesList.push(issue);
                });
            }
            return issuesList;
        }, []);
        if (allIssues.length === 0) {
            return res.json({ message: 'All SOS issues resolved' });
        }
        res.json(allIssues);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.resolveIssue = async(req, res) => {
    try {
        const { adminId, badgeID, issueID } = req.params;
        const user = await User.findOne({ badgeID });
        if (!user) {
            return res.status(250).json({ error: 'User not found' });
        }
        console.log('User:', user);
        const issue = user.issues.find(issueObj => issueObj.issue.issueID === parseInt(issueID));
        if (!issue) {
            return res.status(250).json({ error: 'Issue not found' });
        }
        issue.issue.resolved = true; // Mark the resolved field as true
        issue.pertaining = false; // Assuming you also want to set pertaining to false

        await user.save();
        // await user.save();
        res.json({ message: 'Issue resolved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

async function generateNewNotificationId(badgeID) {
    try {
        const user = await User.findOne({ badgeID: badgeID }).sort({ 'notifications.notificationID': -1 });

        if (user && user.notifications.length > 0) {
            return user.notifications[0].notificationID + 1;
        }

        return 1;
    } catch (error) {
        console.error('Error generating notificationId', error);
        throw error;
    }
}

exports.addUserNotification = async(req, res) => {
    try {
        const { badgeID, title, type, message } = req.body;

        if (badgeID >= 20000 && badgeID <= 30000) {
            const usersWithPoliceStationId = await SqlString.User.find({ policeStationId: badgeID });

            if (usersWithPoliceStationId.length === 0) {
                return res.status(250).json({ error: 'No users found with the specified policeStationId' });
            }

            for (const user of usersWithPoliceStationId) {
                const notificationID = await generateNewNotificationId();
                const notification = {
                    notificationID: notificationID,
                    title: title,
                    type: type,
                    message: message,
                    timestamp: Date.now(),
                    read: false,
                };
                user.notifications.push(notification);
                await user.save();
            }
        } else if (badgeID >= 1 && badgeID <= 1000) {
            const user = await User.findOne({ badgeID: badgeID });

            if (!user) {
                return res.status(250).json({ error: 'User not found' });
            }

            const notificationID = await generateNewNotificationId();

            const notification = {
                notificationID: notificationID,
                title: title,
                type: type,
                message: message,
                timestamp: Date.now(),
                read: false,
            };
            user.notifications.push(notification);
            await user.save();
        } else {
            return res.status(250).json({ error: 'Invalid badgeID. The badgeID must be between 1 to 1000 or 20000 to 30000' });
        }

        res.json({ message: 'Notification added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getUpcomingSessionsForSurviellance = async(req, res) => {
    try {
        const { adminId } = req.params;
        const admin = await Admin.findOne({ adminId: adminId });
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        const users = await User.find({ policeStationId: { $in: admin.policeStation.map(ps => ps.policeStationId) } });

        const minus = 5.5 * 60 * 60 * 1000;
        const currentDate = new Date();
        const twelve = 12 * 60 * 60 * 1000;
        let usersOfInterest = [];
        let currentSessions = [];
        let ans = [];
        let obj = null;
        for (const user of users) {
            for (const { session }
                of user.sessions) {
                const sessionInfo = await Session.findById(session._id);
                if (sessionInfo) {
                    const sessionStartTime = sessionInfo.startTime;
                    const sessionEndTime = sessionInfo.endTime;

                    const currentTime = currentDate.getTime();
                    if (sessionEndTime < currentTime) {
                        continue;
                    } else if (
                        sessionStartTime <= currentTime &&
                        currentTime <= sessionEndTime
                    ) {
                        obj = {
                                userid: user._id,
                                badgeID: 3,
                                firstName: user.firstName,
                                surname: user.surname,
                                password: user.password,
                                rank: user.rank,
                                profilePic: user.profilePic,
                                policeStationId: user.policeStationId,
                                phoneNo: user.phoneNo,
                                emailId: user.emailId,
                                gender: user.gender,
                                reportsTo: user.reportsTo,
                                sessions: user.sessions,
                                issues: user.issues,
                                session_id: sessionInfo._id,
                                sessionID: sessionInfo.sessionID,
                                sessionLocation: sessionInfo.sessionLocation,
                                sessionDate: sessionInfo.sessionDate,
                                startTime: sessionInfo.startTime,
                                endTime: sessionInfo.endTime,
                                latitude: sessionInfo.latitude,
                                longitude: sessionInfo.longitude,
                                createdBy: sessionInfo.createdBy,
                                checkpoints: sessionInfo.checkpoints

                            }
                            // currentSessions.push(sessionInfo);
                            // usersOfInterest.push(users);
                        ans.push(obj)
                    } else if (
                        sessionStartTime >= currentTime &&
                        sessionStartTime - currentTime <= twelve
                    ) {
                        obj = {
                            userid: user._id,
                            badgeID: 3,
                            firstName: user.firstName,
                            surname: user.surname,
                            password: user.password,
                            rank: user.rank,
                            profilePic: user.profilePic,
                            policeStationId: user.policeStationId,
                            phoneNo: user.phoneNo,
                            emailId: user.emailId,
                            gender: user.gender,
                            reportsTo: user.reportsTo,
                            sessions: user.sessions,
                            issues: user.issues,
                            session_id: sessionInfo._id,
                            sessionID: sessionInfo.sessionID,
                            sessionLocation: sessionInfo.sessionLocation,
                            sessionDate: sessionInfo.sessionDate,
                            startTime: sessionInfo.startTime,
                            endTime: sessionInfo.endTime,
                            latitude: sessionInfo.latitude,
                            longitude: sessionInfo.longitude,
                            createdBy: sessionInfo.createdBy,
                            checkpoints: sessionInfo.checkpoints

                        }
                        ans.push(obj)
            
                    }
                }
            }
        }

        res.json({
            ans
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};


exports.getUsersUnderAdmin = async(req, res) => {
    const { adminId } = req.params;
    const admin = await Admin.findOne({ adminId: adminId });
    if (!admin) {
        return res.status(250).json({ error: 'Admin not found' });
    }
    const users = await User.find({ reportsTo: adminId });
    if (users.length > 0) {
        return res.status(200).json({ users });
    } else {
        return res.status(250).json({ error: 'No users found under this admin' });
    }
}
exports.createAdmin = async(req, res) => {
    try {
        const { adminId, firstName, emailId, password, designation } = req.body;
        const existingAdmin = await Admin.findOne({ $or: [{ adminId }, { emailId }] });
        if (existingAdmin) {
            return res.status(250).json({ error: 'Admin with the same adminId or emailId already exists' });
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
        res.status(500).json({ error: 'Server error' })
    }
}