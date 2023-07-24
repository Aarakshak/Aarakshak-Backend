// const mongoose = require('mongoose');
// const Admin = require('./models/adminModel');


// const URL = 'mongodb+srv://chinmay:12345@cluster0.uiodoqm.mongodb.net/cluster0?retryWrites=true&w=majority'

// const adminsData = [
//     {
//       adminId: 12345,
//       firstName: 'Chinmay',
//       emailId: 'chinmayagarwal4@gmail.com',
//       password: 'password1',
//       designation: 'Admin',
//     },
//     {
//       adminId: 234567,
//       firstName: 'Prateek',
//       emailId: 'admin2@example.com',
//       password: 'password2',
//       designation: 'Sub-admin',
//     },
//   ];

// async function insertAdmins() {
//     try {
//       // Connect to MongoDB
//       await mongoose.connect(URL, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//       });
  
//       // Insert admin records into the database
//       await Admin.insertMany(adminsData);
  
//       console.log('Admins inserted successfully');
  
//       // Close the connection
//       mongoose.connection.close();
//     } catch (error) {
//       console.error('Error inserting admins:', error);
//     }
//   }
//   insertAdmins();


// // // Insert sessions separately
// // const insertUsers = async () => {
// //   try {
// //     // Create new User instances
// //     const users = [
// //       {
// //         badgeID: 34567,
// //         firstName: 'John',
// //         surname: 'Doe',
// //         password: '12345',
// //         rank: 'Sergeant',
// //         profilePic: 'profile.jpg',
// //         location: 'New York',
// //         zone: 'Zone 1',
// //         sub_division: 'Subdivision A',
// //         police_station: 123,
// //         phoneNo: '8954502462',
// //         emailId: 'chinmayagarwal4@gmail.com',
// //         gender: 'Male',
// //         sessions: [],
// //         issues: [],
// //         sos: [],
// //       },
  
// //     ];

// //     // Save the User instances to the database
// //     const savedUsers = await User.insertMany(users);
// //     console.log('Users saved:', savedUsers);
// //     // insertSessions(savedUsers);
// //   } catch (error) {
// //     console.error('Error saving users:', error);
// //   }
// // }

// // Insert sessions separately
// // const insertSessions = async (users) => {
// //   try {
// //     // Create new Session instances
// //     const sessions = [
// //       {
// //         sessionID: 1,
// //         sessionLocation: 'Location 1',
// //         sessionLocation2: 'Location 1.2',
// //         sessionDate: new Date('2023-07-01'),
// //         startTime: new Date('2023-07-01T10:00:00Z'),
// //         endTime: new Date('2023-07-01T12:00:00Z'),
// //       },
// //       {
// //         sessionID: 2,
// //         sessionLocation: 'Location 2',
// //         sessionLocation2: 'Location 2.2',
// //         sessionDate: new Date('2023-07-02'),
// //         startTime: new Date('2023-07-02T14:00:00Z'),
// //         endTime: new Date('2023-07-02T16:00:00Z'),
// //       },
// //       // Add more sessions as needed
// //     ];

// //     // Save the Session instances to the database
// //     const savedSessions = await Session.insertMany(sessions);
// //     console.log('Sessions saved:', savedSessions);
// //     assignSessionsToUsers(savedSessions, users);
// //   } catch (error) {
// //     console.error('Error saving sessions:', error);
// //   }
// // };

// // // Assign sessions to users
// // const assignSessionsToUsers = async (sessions, users) => {
// //   try {
// //     for (const user of users) {
// //       // Assign a specific session to the user
    
// //       const sessionToAssign = sessions[Math.floor(Math.random() * sessions.length)];
// //       user.sessions.push({
// //         session: sessionToAssign._id, // Assign the session ID directly
// //         attended: false,
// //       });

// //       // Save the updated user
// //       const updatedUser = await user.save();
// //       console.log('User with assigned session:', updatedUser);
// //     }
// //   } catch (error) {
// //     console.error('Error assigning sessions to users:', error);
// //   }
// // };