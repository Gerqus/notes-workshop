import express = require('express');
import * as bodyParser from 'body-parser';
import cookieParser = require('cookie-parser');
import path = require('path');

import apiRoutes = require('@/routes/apiRoutes');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

app.use('/api', apiRoutes);

app.use('/', express.static(path.join(__dirname, '../static')));

const listeningPort = 6040;

app.listen(listeningPort, () => {
  console.log(`Server listening on :${listeningPort}`);
});

export default {foo: 'bar'};
