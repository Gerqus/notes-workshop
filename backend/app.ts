import express = require('express');
import bodyParser = require('body-parser');
import cookieParser = require('cookie-parser');

import apiRoutes = require('./routes/apiRoutes');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

app.use('/api', apiRoutes);

const listeningPort = 6040;

app.listen(listeningPort, () => {
  console.log(`Listening on :${listeningPort}`);
});
