import express = require('express');
import * as bodyParser from 'body-parser';
import cookieParser = require('cookie-parser');
import path = require('path');
import dbService from '@/services/db.service';

import apiRoutes = require('@/routes/apiRoutes');

const app = express();

dbService.connect('mongodb://localhost:27017')
  .then(() => {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    
    app.use(cookieParser());
    
    app.use('/api', apiRoutes);
    
    app.use('/', express.static(path.join(__dirname, '../static/')));

    app.use('/*', express.static(path.join(__dirname, '../static/')));
    
    const listeningPort = 6040;
    
    app.listen(listeningPort, () => {
      console.log(`Server listening on :${listeningPort}`);
    });
  })
  .catch(() => {
    console.error('Server startup failed on connecting to database');
  });

