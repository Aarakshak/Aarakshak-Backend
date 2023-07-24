const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config()

const bodyParser = require('body-parser');
const morgan = require('morgan');
const notFoundMiddleware = require('./middleware/not-found');

const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes')

const app = express();

app.use(bodyParser.json());
app.use(morgan('dev'));

app.use('/v1/user', userRoutes);
app.use('/v1/admin', adminRoutes);


app.use(notFoundMiddleware)

const port = 3000;
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(3000, () => {
      console.log(`Server started on port: ${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });