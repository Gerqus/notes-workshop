import * as express from 'express';
import routesModules = require('../controllers');

const apiRouter = express.Router();

Object.keys(routesModules).forEach((controllerName: keyof typeof routesModules) => {
  Object.keys(routesModules[controllerName]).forEach((method) => {
    Object.keys((routesModules as any)[controllerName][method]).forEach((path) => {
      const routerMethod = (apiRouter[method as keyof typeof apiRouter] as any).bind(apiRouter);
      routerMethod(path, (routesModules as any)[controllerName][method][path]);
    });
  });
});

export = apiRouter;
