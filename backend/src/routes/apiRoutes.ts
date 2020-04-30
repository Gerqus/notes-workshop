import * as express from 'express';
import routesModules = require('@/controllers');
import { httpRequestTypes } from 'types/';

declare type normalizedRouter = {
  [request in httpRequestTypes]?: express.IRouterMatcher<express.IRouter>
}

const apiRouter: normalizedRouter = express.Router();

Object.keys(routesModules).forEach((controllerName: keyof typeof routesModules) => {
  Object.keys(routesModules[controllerName]).forEach((path) => {
    Object.keys((routesModules as any)[controllerName][path]).forEach((method: httpRequestTypes) => {
      const routerMethod = (apiRouter[method]).bind(apiRouter);
      routerMethod(path, routesModules[controllerName][path][method]);
    });
  });
});

export = apiRouter as express.Router;
