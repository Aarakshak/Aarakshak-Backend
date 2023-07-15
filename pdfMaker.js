const pdf = require("pdf-creator-node");
const fs = require("fs");
const mongoose = require('mongoose');
const handlebars = require("handlebars");
var html = fs.readFileSync('template.html', 'utf8')
const URL = 'mongodb+srv://chinmay_1:HRabrVuwwJOFKpBl@aarakhak.acwhpb1.mongodb.net/aarakshak?retryWrites=true&w=majority'
mongoose.connect(URL, { useNewUrlParser: true });

handlebars.registerHelper("formatDate", function(dateString) {
    const date = new Date(dateString);
    return date.toDateString();
});

handlebars.registerHelper("formatTime", function(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
});
const { User } = require('./server');
console.log("Received schema");
(async() => {
    try {
        // Insert lookup code
        const users = await User.find({ badgeID: 10000, }).lean();

        const data = {
            data: users.map(user => ({
                badgeID: user.badgeID,
                firstName: user.firstName,
                surname: user.surname,
                rank: user.rank,
                pic: user.profilePic,
                location: user.location,
                gender: user.gender,
                sessions: user.sessions,
                attended: user.attended,
                issues: user.issues,
                reportsTo: user.reportsTo,
            }))
        };

        const options = {
            format: "A4",
            orientation: "portrait",
            border: "10mm"
        };
        const template = handlebars.compile(html);
        const document = {
            html: html,
            data: data,
            path: "./output.pdf"
        };

        const result = await pdf.create(document, options);
        console.log(result);
    } catch (error) {
        console.error(error);
    }
})();