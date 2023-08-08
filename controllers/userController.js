const User = require('../models/schema');
const Session = require('../models/session')
const pdf = require("pdf-creator-node");
const fs = require("fs");
const handlebars = require("handlebars");
var html = fs.readFileSync('template.html', 'utf8')
const dotenv = require('dotenv');
dotenv.config()
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const secretKey = crypto.randomBytes(64).toString('hex');
const mongoose = require('mongoose')
const nodemailer = require('nodemailer');
const { DateTime } = require('luxon');


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
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.verifyOTP = async(req, res) => {
    try {
        let { badgeID, otp } = req.body;
        let user = await User.findOne({ badgeID });
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        if (user.otp !== otp || Date.now() > user.otpExpiration) {
            return res.status(401).json({ error: 'Invalid otp' });
        }

        const imageUrl = user.profilePic;

        user.otp = undefined;
        user.otpExpiration = undefined;

        user = await user.save();
        const token = jwt.sign({ emailId: user.emailId, badgeID: user.badgeID }, // Include badgeID in the payload
            secretKey, {
                expiresIn: '1d', // Set the expiration time for the token
            }
        );
        user.jwtToken = token;
        await user.save();

        res.json({ token, badgeID: user.badgeID, imageUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getUserByBadgeID = async(req, res) => {
    try {
        const badgeID = parseInt(req.params.badgeID);

        if (isNaN(badgeID)) {
            return res.status(400).json({ error: 'Invalid badge ID' });
        }

        const user = await User.findOne({ badgeID });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { rank, firstName, surname,profilePic, sessions } = user;
        const sessionInfo = sessions.map(({ session }) => ({
            location: session.sessionLocation,
            location2: session.sessionLocation2,
            date: session.sessionDate,
            startTime: formatTime(session.startTime),
            endTime: formatTime(session.endTime),
        }));

        const response = {
            rank,
            badgeID,
            firstName,
            surname,
            profilePic,
            sessions: sessionInfo,
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getCurrentSession = async(req, res) => {
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
        const minus = 5.5 * 60 * 60 * 1000;
        const currentTime = currentDate.getTime() + minus;

        let currentSession = null;
        for (const { session }
            of user.sessions) {
            const sessionInfo = await Session.find({ _id: session });
            if (!sessionInfo) {
                console.log("Not found")
                continue; 
            }
            if (sessionInfo[0]) {
                const sessionStartDate = new Date(sessionInfo.sessionDate);
                const sessionStartTime = sessionInfo[0].startTime.getTime();
                const sessionEndTime = sessionInfo[0].endTime.getTime();

                if (currentTime >= sessionStartTime && currentTime <= sessionEndTime) {
                    currentSession = sessionInfo;
                    break; 
                }
            }
        }

        if (!currentSession) {
            return res.status(201).json({ error: 'No current session found' });
        }

        const response = {
            sessionId: currentSession[0].sessionID,
            location1: currentSession[0].sessionLocation,
            reportingTo: user.reportsTo,
            checkpoints: currentSession[0].checkpoints,
            checkInTime: currentSession[0].startTime.toISOString(),
            checkOutTime: currentSession[0].endTime.toISOString(),
            checkpointCount: currentSession[0].checkpoints.length,
            date: currentDate,
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};



exports.createIssue = async(req, res) => {
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


        const { title, issueText, latitude, longitude } = req.body;

        const issue = {
            issue: {
                badgeID: user.badgeID,
                profilePic: user.profilePic,
                name: user.firstName,
                issueID: issueID,
                title: title,
                issueText: issueText,
                raised: new Date(),
                resolved: false,
                latitude: latitude,
                longitude: longitude
            },
        };
        user.issues.push(issue);

        await user.save();

        res.json(issue);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getPreviousSessionsAttendance = async(req, res) => {
    try {
        const badgeID = parseInt(req.params.badgeID);

        if (isNaN(badgeID)) {
            return res.status(400).json({ error: 'Invalid badge ID' });
        }

        const user = await User.findOne({ badgeID });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (!user.sessions || !Array.isArray(user.sessions)) {
            return res.status(404).json({ error: 'No session data found for the user' });
        }

        user.sessions.forEach((session) => {
            if (session && session.checkpoints && Array.isArray(session.checkpoints)) {
                session.totalCheckpoints = session.checkpoints.length;
            }
        });

        user.sessions.forEach((session) => {
            if (session && session.totalCheckpoints) {
                const sessionsAttended = session.attendedCheckpoints >= session.totalCheckpoints * 0.75;
                session.attended = sessionsAttended;
            }
        });

        await user.save();

        const totalSessionsAlloted = user.sessions.length;
        const totalSessionsAttended = user.sessions.filter(({ attended }) => attended).length;

        const attendancePercentage = (totalSessionsAlloted > 0) ?
            (totalSessionsAttended / totalSessionsAlloted) * 100 :
            0;

        const previousSessions = await Promise.all(
            user.sessions.map(async({ session, attended }) => {
                const sessionID = session;
                const sessionInfo = await Session.findById(sessionID);

                if (!sessionInfo) {
                    return null;
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

exports.getUpcomingSession = async(req, res) => {
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
            if (session && session.sessionDate) {
                const sessionDate = new Date(session.sessionDate);
                return sessionDate > currentDate;
            }
            return false;
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
            name: `${user.firstName} ${user.surname}`,
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

exports.getProfileOfUserByBadgeID = async(req, res) => {
    try {
        const badgeID = parseInt(req.params.badgeID);

        if (isNaN(badgeID)) {
            return res.status(400).json({ error: 'Invalid badge ID' });
        }
        const user = await User.findOne({ badgeID });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            picture: user.profilePic,
            name: `${user.firstName} ${user.surname}`,
            policeId: user.badgeID,
            mobileNo: user.phoneNo,
            email: user.emailId,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getUserNotifications = async(req, res) => {
    try {
        const { badgeID } = req.params;
        const user = await User.findOne({ badgeID });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user.notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.markNotificatonsReaded = async(req, res) => {
    try {
        const { badgeID, notificationId } = req.params;
        const user = await User.findOne({ badgeID });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const notification = user.notifications.find((n) => n.notificationId === (notificationId));

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        notification.read = true;
        await user.save();
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    };
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance;
}

function checkWithinThreshold(user, session, threshold) {
    const userLat = user.latitude;
    const userLon = user.longitude;

    const sessionLat = session.latitude;
    const sessionLon = session.longitude;

    const distance = calculateDistance(userLat, userLon, sessionLat, sessionLon);


    if (distance <= threshold) {
        return true;
    } else {
        return false;
    }
}

function convertPDFToBytes(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}
exports.createpdf = async(req, res) => {

    const { badgeID } = req.params
    const user = await User.findOne({ badgeID: badgeID })
    if (!user) {
        return res.status(400).json({ error: 'User not found' })
    }
    user.sessions.forEach((session) => {
        if (session && session.checkpoints && Array.isArray(session.checkpoints)) {
            session.totalCheckpoints = session.checkpoints.length;
        }
    });
    const previousSessions = await Promise.all(
        user.sessions.map(async({ session, attended }) => {
            const sessionID = session;
            const sessionInfo = await Session.findById(sessionID);

            if (!sessionInfo) {
                return null;
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

    user.sessions.forEach((session) => {
        if (session && session.totalCheckpoints) {
            const sessionsAttended = session.attendedCheckpoints >= session.totalCheckpoints * 0.75;
            session.attended = sessionsAttended;
        }
    });
    await user.save();

    const totalSessionsAlloted = user.sessions.length;
    const totalSessionsAttended = user.sessions.filter(({ attended }) => attended).length;

    const attendancePercentage = (totalSessionsAlloted > 0) ?
        (totalSessionsAttended / totalSessionsAlloted) * 100 :
        0;

    const data = {

        badgeID: user.badgeID,
        firstName: user.firstName,
        surname: user.surname,
        rank: user.rank,
        pic: user.profilePic,
        gender: user.gender,
        reportsTo: user.reportsTo,
        attendancePercentage,
        totalSessionsAttended,
        totalSessionsAlloted,
        previousSessions: filteredPreviousSessions,

    };
    res.json(({ data }))
    const options = {
        format: "A4",
        orientation: "portrait",
        header: {
            height: '0mm',
        },
        

    };
    const template = handlebars.compile(html, {
        allowedProtoMethods: {
            trim: true
        }
    });
    const path = "./Report" + badgeID + ".pdf"
    const document = {
        html: html,
        data: data,
        path: "./Report" + badgeID + ".pdf"
    };
    const result = await pdf.create(document, options);
    if (!result) {
        console.error(error);
    }
    convertPDFToBytes(path)
        .then(pdfBytes => {
            console.log('PDF converted to bytes:', pdfBytes);
            // Now you can use `pdfBytes` as needed
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// exports.checkInCheckpoint = async(req, res) => {
//     try {
//         const { badgeID, sessionID } = req.params;
//         const { timestamp, location } = req.body;

//         const user = await User.findOne({ badgeID: badgeID });

//         if (!user) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         const session = await Session.findOne({ sessionID: sessionID });
//         if (!session) {
//             return res.status(404).json({ error: 'Session not found or wrong session logged In' });
//         }

//         const currentTime = Date.now();
//         const tenMinutesAgo = currentTime - 10 * 60 * 1000;
//         if (timestamp < tenMinutesAgo || timestamp > currentTime) {
//             return res.status(400).json({ error: 'Invalid timestamp' });
//         }

//         const isWithinThreshold = checkWithinThreshold(user, session, 100);

//         if (isWithinThreshold) {
//             const checkpointIndex = user.sessions.findIndex((session) => session.session.equals(ObjectId(sessionID)));

//             if (checkpointIndex !== -1) {
//                 user.sessions[checkpointIndex].attendedCheckpoints += 1;
//                 user.sessions[checkpointIndex].totalCheckpoints += 1;
//                 user.sessions[checkpointIndex].lastAttended = true;
//                 user.sessions[checkpointIndex].lastCheckpointTimestamp = timestamp;
//                 user.sessions[checkpointIndex].lastCheckpointLocation = location;
//                 await user.save();
//             }
//         } else {
//             const checkpointIndex = user.sessions.findIndex((session) => session.session.equals(ObjectId(sessionID)));

//             if (checkpointIndex !== -1) {
//                 user.sessions[checkpointIndex].totalCheckpoints += 1;
//                 user.sessions[checkpointIndex].lastAttended = false;
//                 user.sessions[checkpointIndex].lastCheckpointTimestamp = timestamp;
//                 user.sessions[checkpointIndex].lastCheckpointLocation = location;
//                 await user.save();
//             }
//         }

//         res.json({ message: 'Checkpoint checked in successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Server error' });
//     }
// };
exports.checkInCheckpoint = async(req, res) => {
    try {
        const { badgeID, sessionID } = req.params;
        const { timestamp, location, radius, isWithinCorrectLocation } = req.body;

        const user = await User.findOne({ badgeID: badgeID });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const session = await Session.findOne({ sessionID: sessionID });
        if (!session) {
            return res.status(404).json({ error: 'Session not found or wrong session logged In' });
        }

        const currentTime = Date.now();
        const tenMinutesAgo = currentTime - 10 * 60 * 1000;
        if (timestamp < tenMinutesAgo || timestamp > currentTime) {
            return res.status(400).json({ error: 'Invalid timestamp' });
        }

        if (isWithinCorrectLocation == false) {
            // Handle the case where the user is not within the correct location
            return res.status(400).json({ error: 'User is not within correct location' });
        }

        const checkpointIndex = user.sessions.findIndex((session) => session.session.equals(ObjectId(sessionID)));

        if (checkpointIndex !== -1) {
            user.sessions[checkpointIndex].totalCheckpoints += 1;
            user.sessions[checkpointIndex].lastAttended = isWithinCorrectLocation;
            user.sessions[checkpointIndex].lastCheckpointTimestamp = timestamp;
            user.sessions[checkpointIndex].lastCheckpointLocation = location;
            await user.save();
        }

        res.json({ message: 'Checkpoint checked in successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.startDutyFromNFC = async(req, res) => {
    try {
        const { badgeID } = req.params;
        const { latitude, longitude, radius } = req.body;

        const user = await User.findOne({ badgeID });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const session = await Session.findOne({
            sessionDate: { $gte: new Date() },
            latitude: latitude,
            longitude: longitude,
        });

        if (!session) {
            return res.status(250).json({ error: 'Session not found for user at the given location' });
        }

        // console.log('User Sessions:', user.sessions);
        // console.log('Session ID:', session.sessionID);

        let sessionToUpdate = user.sessions.find(s => s.session.equals(session._id));
        
        console.log('Session to Update:', sessionToUpdate);
        if (sessionToUpdate ) {
            sessionToUpdate.dutyStarted = true;
            sessionToUpdate.dutyStartTime = new Date();
            sessionToUpdate.radius = radius;
            await user.save();
            res.json({ message: 'Duty started and session information updated' });
        } else {
            res.status(500).json({ error: 'Server error' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};


// exports.startDutyFromNFC = async(req, res) => {
//     try {
//         const { badgeID } = req.params;
//         const { latitude, longitude, radius } = req.body;

//         const user = await User.findOne({ badgeID });

//         if (!user) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         const session = await Session.findOne({
//             sessionDate: { $gte: new Date() },
//             latitude: latitude,
//             longitude: longitude,
//         });

//         if (!session) {
//             return res.status(250).json({ error: 'Session not found for user at the given location' });
//         }
//         console.log('User Sessions:', user.sessions);
//         console.log('Session ID:', session.sessionID);

//         let sessionToUpdate = user.sessions.find(s => s.session.equals(session._id));
        
//         console.log('Session to Update:', sessionToUpdate);
//         if (sessionToUpdate) {
//             sessionToUpdate.dutyStarted = true;
//             sessionToUpdate.dutyStartTime = new Date();
//             sessionToUpdate.radius = radius;
//             await user.save();
//         }
//         res.json({ message: 'Duty started and session information updated' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Server error' });
//     }
// };


exports.endDuty = async(req, res) => {
    try {
        const { badgeId } = req.params;

        const user = await User.findOne({ badgeID: badgeId });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const sessionToUpdate = user.sessions.find(s => s.dutyStarted && !s.dutyEnded);

        if (!sessionToUpdate) {
            return res.status(404).json({ error: 'No active duty session found' });
        }

        sessionToUpdate.dutyEnded = true;
        sessionToUpdate.dutyEndTime = new Date();

        await user.save();

        res.json({ message: 'Duty ended successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getSessionInfo = async (req, res) => {
    try {
        const { sessionID } = req.params;

        const session = await Session.findById(sessionID);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({
            session: {
                sessionID: session.sessionID,
                sessionLocation: session.sessionLocation,
                sessionDate: session.sessionDate,
                startTime: session.startTime,
                endTime: session.endTime,
                // ... other session details ...
                checkpoints: session.checkpoints,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};