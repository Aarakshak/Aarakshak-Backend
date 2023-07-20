const express = require('express');
const mongoose = require('mongoose');

const bodyParser = require('body-parser');
const morgan = require('morgan');
const notFoundMiddleware = require('./middleware/not-found');

const userRoutes = require('./routes/userRoutes');
const alertRoutes = require('./routes/alertRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const profileRoutes = require('./routes/profileRoutes');
const app = express();

app.use(bodyParser.json());
app.use(morgan('dev'));

app.use('/v1/home/user', userRoutes);
app.use('/v1/alert',alertRoutes);
app.use('/v1/session', sessionRoutes);
app.use('/v1/profile', profileRoutes);

app.use(notFoundMiddleware)

const port = 3000;
const URL = 'mongodb+srv://chinmay:12345@cluster0.uiodoqm.mongodb.net/cluster0?retryWrites=true&w=majority'
mongoose.connect(URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
    // Start the server once connected to the database
    app.listen(3000, () => {
      console.log(`Server started on port: ${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });