// const mongoose = require('mongoose');
// const User = require('./models/schema'); // Import the User model
// const Session = require('./models/session'); // Import the Session model




//   useNewUrlParser: true,
// })
//   .then(() => {
//     console.log('Connected to MongoDB');
//     insertUsers();
//   })
//   .catch((error) => {
//     console.error('MongoDB connection error:', error);
//   });


// // Insert sessions separately
// const insertUsers = async () => {
//   try {
//     // Create new User instances
//     const users = [
//       {
//         badgeID: 12345,
//         firstName: 'John',
//         surname: 'Doe',
//         password: '12345',
//         rank: 'Sergeant',
//         profilePic: 'profile.jpg',
//         location: 'New York',
//         zone: 'Zone 1',
//         sub_division: 'Subdivision A',
//         police_station: 123,
//         phoneNo: '8954502462',
//         emailId: 'chinmayagarwal4@example.com',
//         gender: 'Male',
//         sessions: [],
//         issues: [],
//         sos: [],
//       },
//       {
//         badgeID: 23456,
//         firstName: 'Jane',
//         surname: 'Smith',
//         password: '12345',
//         rank: 'Officer',
//         profilePic: 'profile.jpg',
//         location: 'London',
//         zone: 'Zone 2',
//         sub_division: 'Subdivision B',
//         police_station: 456,
//         phoneNo: '9876543210',
//         emailId: 'jane@example.com',
//         gender: 'Female',
//         sessions: [],
//         issues: [],
//         sos: [],
//         reportsTo: 12345,
//       },
//       // Add more users as needed
//     ];

//     // Save the User instances to the database
//     const savedUsers = await User.insertMany(users);
//     console.log('Users saved:', savedUsers);
//     insertSessions(savedUsers);
//   } catch (error) {
//     console.error('Error saving users:', error);
//   }
// }

// // Insert sessions separately
// const insertSessions = async (users) => {
//   try {
//     // Create new Session instances
//     const sessions = [
//       {
//         sessionID: 1,
//         sessionLocation: 'Location 1',
//         sessionLocation2: 'Location 1.2',
//         sessionDate: new Date('2023-07-01'),
//         startTime: new Date('2023-07-01T10:00:00Z'),
//         endTime: new Date('2023-07-01T12:00:00Z'),
//       },
//       {
//         sessionID: 2,
//         sessionLocation: 'Location 2',
//         sessionLocation2: 'Location 2.2',
//         sessionDate: new Date('2023-07-02'),
//         startTime: new Date('2023-07-02T14:00:00Z'),
//         endTime: new Date('2023-07-02T16:00:00Z'),
//       },
//       // Add more sessions as needed
//     ];

//     // Save the Session instances to the database
//     const savedSessions = await Session.insertMany(sessions);
//     console.log('Sessions saved:', savedSessions);
//     assignSessionsToUsers(savedSessions, users);
//   } catch (error) {
//     console.error('Error saving sessions:', error);
//   }
// };

// // Assign sessions to users
// const assignSessionsToUsers = async (sessions, users) => {
//   try {
//     for (const user of users) {
//       // Assign a specific session to the user
    
//       const sessionToAssign = sessions[Math.floor(Math.random() * sessions.length)];
//       user.sessions.push({
//         session: sessionToAssign._id, // Assign the session ID directly
//         attended: false,
//       });

//       // Save the updated user
//       const updatedUser = await user.save();
//       console.log('User with assigned session:', updatedUser);
//     }
//   } catch (error) {
//     console.error('Error assigning sessions to users:', error);
//   }
// };