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
        const newOTP = generateOTP();
        admin.otp = newOTP;
        admin.otpExpiration = Date.now() + 5 * 60 * 1000;

        await sendOTPByEmail(emailId, newOTP);

        admin = await admin.save();

        res.json({ message: 'OTP sent', adminID: admin.adminId, firstName: admin.firstName });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.verifyOTP = async(req, res) => {
    try {
        let { adminId, otp } = req.body;

        const admin = await Admin.findOne({ adminId });
        if (!admin) {
            return res.status(250).json({ error: 'Admin not found' })
        }

        if (admin.otp !== otp || Date.now() > admin.otpExpiration) {
            return res.status(250).json({ error: 'Invalid otp' });
        }

        admin.otp = undefined;
        admin.otpExpiration = undefined;

        await admin.save();
        const token = jwt.sign({ emailId: admin.emailId, adminId: admin.adminId, firstName: admin.firstName  },
            secretKey, {
                expiresIn: '1d',
            }
        );
        admin.jwtToken = token;
        await admin.save();
        res.json({ token, adminId: admin.adminId, firstName: admin.firstName  });
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
        const { badgeID, firstName, surname, rank, profilePic, policeStationId, location, zone, sub_division, police_station, totalSessions,totalAttended, totalHoursOnDuty, phoneNo, emailId, gender } = req.body;
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
            totalSessions,
            totalAttended,
            totalHoursOnDuty,
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

exports.deleteSessionByAdmin = async (req, res) => {
    try {
        const { adminId, sessionID } = req.params;

        // Find the admin
        const admin = await Admin.findOne({ adminId: adminId });
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        // Find the session
        const session = await Session.findOne({ sessionID: sessionID });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Delete the session
        await session.deleteOne({sessionID});


        res.json({ message: 'Session deleted successfully' });
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

// exports.addSessionByAdmin = async (req, res) => {
//     try {
//         const { adminId } = req.params;
//         const { sessionLocation, sessionDate, startTime, endTime, latitude, longitude, description, emergency} = req.body;

//         const currentDate = new Date();
//         if (new Date(sessionDate) <= currentDate || new Date(startTime) <= currentDate || new Date(endTime) <= currentDate) {
//             return res.status(250).json({ error: 'Invalid session date or times' });
//         }
// 2
//         const lastSession = await Session.findOne().sort({ sessionID: -1 });
//         const sessionID = lastSession ? lastSession.sessionID + 1 : 1;

//         const admin = await Admin.findOne({ adminId: adminId });
//         if (!admin) {
//             return res.status(250).json({ error: 'Admin not found' });
//         }

//         const sessionDateUTC = new Date(new Date(sessionDate).getTime());
//         const startTimeUTC = new Date(new Date(startTime).getTime() );
//         const endTimeUTC = new Date(new Date(endTime).getTime());

//         const numCheckpoints = 10;
//         const randomCheckpoints = generateCheckPoints(startTimeUTC, endTimeUTC, numCheckpoints);

//         const session = new Session({
//             sessionID,
//             sessionLocation,
//             sessionDate: sessionDateUTC,
//             startTime: startTimeUTC,
//             endTime: endTimeUTC,
//             latitude,
//             longitude,
//             createdBy: adminId,
//             checkpoints: randomCheckpoints
//         });

//         await session.save();

//         res.json({ message: 'Session added successfully', sessionId: sessionID });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Server error' });
//     }
// };
exports.addSessionByAdmin = async(req, res) => {
    try {
        const { adminId } = req.params;
        const { sessionLocation, startTime, endTime, latitude, longitude, description, emergency } = req.body;

        const currentDateUTC = new Date().getTime();
        console.log(currentDateUTC);
    
        const startTimeTimestamp = new Date(startTime).getTime();
        console
        const endTimeTimestamp = new Date(endTime).getTime();

        if (startTimeTimestamp <= currentDateUTC || endTimeTimestamp <= currentDateUTC) {
            return res.status(250).json({ error: 'Invalid session date or times' });
        }

        const lastSession = await Session.findOne().sort({ sessionID: -1 });
        const sessionID = lastSession ? lastSession.sessionID + 1 : 1;

        const admin = await Admin.findOne({ adminId: adminId });
        if (!admin) {
            return res.status(250).json({ error: 'Admin not found' });
        }

        const numCheckpoints = 10;
        const randomCheckpoints = generateCheckPoints(startTime, endTime, numCheckpoints);

        const session = new Session({
            sessionID,
            sessionLocation,
            startTime,
            endTime,
            latitude,
            longitude,
            createdBy: adminId,
            checkpoints: randomCheckpoints,
            description:description,
            emergency
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
            if (sessionEndTime < currentTime) {
                return false; // Exclude sessions that have finished
            } else if (sessionStartTime <= currentTime && currentTime <= sessionEndTime) {
                return true; // Session is in progress
            } else if (sessionStartTime >= currentTime) {
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

exports.getPoliceStations = async (req, res) => {
    try {
   
        const policeStationMapping = {
            20001: { thanaName: 'Patparganj', state: 'Delhi' },
            20002: { thanaName: 'Gl Bajaj, Greater Noida', state: 'Uttar Pradesh' },
       
        };

        const policeStationArray = Object.keys(policeStationMapping).map(policeStationId => ({
            policeStationId,
            thanaName: policeStationMapping[policeStationId].thanaName,
            state: policeStationMapping[policeStationId].state,
        }));

        res.json(policeStationArray);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.assignUsersToSession = async (req, res) => {
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
            const conflictingSession = user.sessions.find((userSession) => {
    
                const userSessionStartTime = userSession.session.startTime;
                console.log(userSessionStartTime);
                const userSessionEndTime = userSession.session.endTime;
                console.log(userSessionEndTime)
                const newSessionStartTime = session.startTime;
                const newSessionEndTime = session.endTime;

                return (
                    userSession.session !== sessionId && // Exclude the current session
                    ((newSessionStartTime >= userSessionStartTime && newSessionStartTime < userSessionEndTime) ||
                    (newSessionEndTime > userSessionStartTime && newSessionEndTime <= userSessionEndTime) ||
                    (newSessionStartTime <= userSessionStartTime && newSessionEndTime >= userSessionEndTime))
                );
            });

            if (conflictingSession) {
                return res.status(250).json({ error: 'User is already assigned to a session at the same time' });
            }
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


// exports.assignUsersToSession = async(req, res) => {
//     try {
//         const { adminId } = req.params;
//         const { sessionId, userIds, description } = req.body;

//         const admin = await Admin.findOne({ adminId: adminId });
//         if (!admin) {
//             return res.status(250).json({ error: 'Admin not found' });
//         }

//         const session = await Session.findOne({ sessionID: sessionId });
//         if (!session) {
//             return res.status(250).json({ error: 'Session not found' });
//         }

//         const users = await User.find({ badgeID: { $in: userIds } });

//         if (!users || users.length === 0) {
//             return res.status(250).json({ error: 'Users not found' });
//         }

//         for (const user of users) {
//             if (user.sessions.some((userSession) => userSession.session && userSession.session.equals(session._id))) {
//                 return res.status(250).json({ error: 'Session already assigned to the user' });
//             }
//         }
//         if (!session) {
//             return res.status(250).json({ error: 'Session not found' });
//         }

//         for (const user of users) {
//             if (user.sessions.some((userSession) => userSession.session === sessionId)) {
//                 continue;
//             }

//             user.sessions.push({
//                 session: session._id,
//                 attended: false,
//             });

//             user.reportsTo = adminId;

//             await user.save();
//         }

//         res.json({ message: 'Users assigned to sessions successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Server error' });
//     }
// };

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
            const usersWithPoliceStationId = await 
        User.find({ policeStationId: badgeID });

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
                                badgeID: user.badgeID,
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
                                startTime: sessionInfo.startTime ,
                                endTime: sessionInfo.endTime,
                                latitude: sessionInfo.latitude,
                                longitude: sessionInfo.longitude,
                                createdBy: sessionInfo.createdBy,
                                checkpoints: sessionInfo.checkpoints

                            }
                        ans.push(obj)
                    } else if (
                        sessionStartTime >= currentTime &&
                        sessionStartTime - currentTime <= twelve
                    ) {
                        obj = {
                            userid: user._id,
                            badgeID: user.badgeID,
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
                            // currentSessions.push(sessionInfo);
                            // usersOfInterest.push(users);
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
exports.getStats = async(req, res) => {
    try {
        const { adminId } = req.params;
        const admin = await Admin.findOne({ adminId: adminId });
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        const users = await User.find({ reportsTo: adminId });
        if (!users || users.length === 0) {
            return res.status(404).json({ error: "Users not found" });
        }
        const currentDate = new Date();
        let ongoingSessions = [];
        let usersRightNow = [];
        let usersInNext12Hours = [];
        let resolvedIssues = [];
        let issuesRaisedToday = [];
        let attendances = [];
        const load = [
            { userID: 3, loadFactor: 0.85 },
            { userID: 10, loadFactor: 0.89 },
            { userID: 5, loadFactor: 1.28 },
            { userID: 6, loadFactor: 1.16 },
            { userID: 7, loadFactor: 1.16 },
            { userID: 8, loadFactor: 1.49 },
            { userID: 9, loadFactor: 1.07 },
            { userID: 11, loadFactor: 0.94 },
            { userID: 12, loadFactor: 1.41 },
            { userID: 13, loadFactor: 0.61 },
            { userID: 14, loadFactor: 1.32 },
            { userID: 15, loadFactor: 1.3 },
            { userID: 16, loadFactor: 0.99 },
            { userID: 17, loadFactor: 0.99 },
            { userID: 18, loadFactor: 1.2 },
            { userID: 19, loadFactor: 0.77 },
            { userID: 20, loadFactor: 1.34 },
            { userID: 4, loadFactor: 0.96 }
          ];
        let totalCheckpoints = 0;
        let totalCheckpointsAttended = 0;
        const minus = 5.5 * 60 * 60 * 1000;
        const twelve = 12 * 60 * 60 * 1000;
        const currentTime = currentDate.getTime() + minus;
        const sessions = await Session.find();
        for (const session of sessions) {
            if (session.startTime.getTime() <= currentTime && currentTime <= session.endTime.getTime()) {
                ongoingSessions.push(session);
            }
        }
        for (const user of users) {
            // console.log(user);
            load.push({ userID: user.badgeID, loadFactor: user.loadFactor });
            console.log(user.loadFactor)
            for (const userSession of user.sessions) {
                const sessionInfo = await Session.findById(userSession.session);
                if (!sessionInfo) {
                    console.log("Session not found");
                    continue; // Skip to the next session
                }
                const sessionStartTime = sessionInfo.startTime.getTime();
                const sessionEndTime = sessionInfo.endTime.getTime();
                // console.log(sessionInfo.sessionID);
                // console.log(sessionInfo.startTime.toISOString());
                // console.log(sessionInfo.endTime.toISOString())
                // console.log(currentDate.toISOString())
                if (sessionStartTime <= currentTime && currentTime <= sessionEndTime) {
                    usersRightNow.push(user); // Push the user object, not the users array
                } else if (sessionStartTime > currentTime && sessionStartTime - currentTime <= twelve) {
                    usersInNext12Hours.push(user);
                }
            }
            // for (const issue of user.issues) {
            //     if (issue === [])
            //         continue;
            //     console.log(issue);
            //     const raisedTime = issue.raised.getTime();
            //     if (issue.resolved) {
            //         resolvedIssues.push(issue);
            //     }
            //     if (raisedTime >= currentTime && raisedTime - currentTime <= 2 * twelve) {
            //         issuesRaisedToday.push(issue);
            //     }
            // }

        }
        const usersSortedByAttendanceRatio = users.slice().sort((userA, userB) => {
            const ratioA = userA.totalSessions === 0 ? 0 : userA.totalAttended / userA.totalSessions;
            const ratioB = userB.totalSessions === 0 ? 0 : userB.totalAttended / userB.totalSessions;
            return ratioB - ratioA; // Sort in descending order
        });

        const usersSortedByTotalHours = users.slice().sort((userA, userB) => {
            return userB.totalHoursOnDuty - userA.totalHoursOnDuty; // Sort in descending order
        });
        const response = {
            load: load,
            dutiesNow: usersRightNow.length,
            usersInNext12Hours: usersInNext12Hours,
            resolvedIssues: resolvedIssues.length,
            issueRaisedToday: issuesRaisedToday,
            usersSortedByAttendanceRatio: usersSortedByAttendanceRatio,
            usersSortedByTotalHours: usersSortedByTotalHours,
            ongoingSessions: ongoingSessions.length
        }
        console.log(load);
        // console.log(usersSortedByAttendanceRatio);
        // console.log(usersRightNow);
        // console.log(usersInNext12Hours.length);
        // console.log(resolvedIssues.length);
        // console.log(issuesRaisedToday.length);
        // console.log(usersSortedByAttendanceRatio.length);
        // console.log(usersSortedByTotalHours.length);
        // console.log(ongoingSessions.length);
        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getNearestUser = async(req, res) => {
    const userLocationArray = [
        { userID: 3, latitude: 34.0522, longitude: -118.2437 },
        { userID: 10, latitude: 40.7128, longitude: -74.0060 },
        { userID: 5, latitude: 51.5074, longitude: -0.1278 },
        { userID: 6, latitude: 48.8566, longitude: 2.3522 },
        { userID: 7, latitude: 52.5200, longitude: 13.4050 },
        { userID: 8, latitude: 37.7749, longitude: -122.4194 },
        { userID: 9, latitude: 35.6895, longitude: 139.6917 },
        { userID: 11, latitude: -33.8688, longitude: 151.2093 },
        { userID: 12, latitude: 25.276987, longitude: 55.296249 },
        { userID: 13, latitude: -22.9068, longitude: -43.1729 },
        { userID: 14, latitude: 41.9028, longitude: 12.4964 },
        { userID: 15, latitude: 19.4326, longitude: -99.1332 },
        { userID: 16, latitude: -34.6076, longitude: -58.4371 },
        { userID: 17, latitude: 55.7558, longitude: 37.6176 },
        { userID: 18, latitude: 37.5665, longitude: 126.9780 },
        { userID: 19, latitude: 43.6532, longitude: -79.3832 },
        { userID: 20, latitude: 35.682839, longitude: 139.759455 },
        { userID: 4, latitude: -33.4489, longitude: -70.6693 }
    ];
    const { adminId, badgeID } = req.params;
    const admin = await Admin.findOne({ adminId: adminId });
    if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
    }
    const user = await User.findOne({ badgeID });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const userEntry = userLocationArray.find(entry => entry.userID === parseInt(badgeID));

    if (!userEntry) {
        return res.status(404).json({ error: 'User not found in location array' });
    }

    const userPosition = { lat: userEntry.latitude, lng: userEntry.longitude };

    let nearestUserID = null;
    let nearestDistance = Infinity;
    let ans = [];
    for (const entry of userLocationArray) {
        console.log(entry)
        console.log(entry.userID)
        console.log(badgeID)
        if (entry.userID == badgeID)
            continue;
        if (entry.userID !== badgeID) {
            const otherUserPosition = { lat: entry.latitude, lng: entry.longitude };
            const distance = await haversine_distance(userPosition, otherUserPosition);
            // console.log(distance)
            if (distance < nearestDistance) {
                // console.log(distance)
                nearestDistance = distance;
                nearestUserID = entry.userID;
            }
        }
    }

    if (nearestUserID === null) {
        return res.status(404).json({ error: 'Nearest user not found' });
    }

    res.json({ nearestUserID, nearestDistance });
};


async function haversine_distance(mk1, mk2) {
    var R = 3958.8; // Radius of the Earth in miles
    var rlat1 = mk1.lat * (Math.PI / 180); // Convert degrees to radians
    var rlat2 = mk2.lat * (Math.PI / 180); // Convert degrees to radians
    var difflat = rlat2 - rlat1; // Radian difference (latitudes)
    var difflon = (mk2.lng - mk1.lng) * (Math.PI / 180); // Radian difference (longitudes)

    var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat / 2) * Math.sin(difflat / 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon / 2) * Math.sin(difflon / 2)));
    // console.log(d)
    return d;
}