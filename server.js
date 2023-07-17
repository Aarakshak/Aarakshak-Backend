const express = require('express');

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
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
