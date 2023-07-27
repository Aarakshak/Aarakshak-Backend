// const mongoose = require('mongoose');
// const Admin = require('./models/adminModel');


// const URL = 'mongodb+srv://chinmay:12345@cluster0.uiodoqm.mongodb.net/cluster0?retryWrites=true&w=majority'

// async function insertAdmin() {
//   try {
//     const newAdmin = new Admin({
//         adminId: 1,
//         firstName: 'Prateek',
//         emailId: 'prustagi_be20@thapar.edu',
//         password: '12345',
//         designation: 'Admin',
//         policeStation: [
//           { policeStationId: 20001 }, 
//           { policeStationId: 20002 },
//         ],
//         otp: null,
//         otpExpiration: null,
//     });

//     // Save the new admin to the database
//     await newAdmin.save();

//     console.log('Admin inserted successfully');
//   } catch (error) {
//     console.error('Error inserting admin:', error);
//   } finally {
//     mongoose.connection.close();
//   }

// }

// mongoose.connect(URL, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });


// insertAdmin();



