import * as express from 'express';
import routesModules = require('../controllers');

const apiRouter = express.Router();

Object.keys(routesModules).forEach((controllerName:keyof typeof routesModules) => {
  Object.keys(routesModules[controllerName]).forEach((path) => {
    apiRouter.use(path, routesModules[controllerName][path]);
  });
})

export = apiRouter;
