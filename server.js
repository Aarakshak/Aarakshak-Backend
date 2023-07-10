const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const alertRoutes = require('./routes/alertRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const app = express();

app.use(bodyParser.json());

app.use('/v1/home/user', userRoutes);
app.use('/v1/alert',alertRoutes);
app.use('/v1/session', sessionRoutes);

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
