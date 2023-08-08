const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const cors = require('cors');
const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
    optionSuccessStatus: 200
}

// var RateLimit = require('express-rate-limit');
// var limiter = RateLimit({
//   windowMs: 1*60*1000, // 1 minute
//   max: 1000
// });

dotenv.config()

const bodyParser = require('body-parser');
const morgan = require('morgan');
const notFoundMiddleware = require('./middleware/not-found');
// const crossOriginMiddleware = require('./middleware/crossOrigin');

const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes')

const app = express();

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use('/v1/user', userRoutes);
app.use('/v1/admin', adminRoutes);


app.use(notFoundMiddleware)

// Cross Origin middleware
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000/");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
})

const port = 8000;
mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(8000, () => {
            console.log(`Server started on port: ${port}`);
        });
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    });