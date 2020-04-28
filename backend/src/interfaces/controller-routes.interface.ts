import * as express from 'express';
import { httpRequestTypes } from './http-request-types.enum';

export type controllerRoutes = {
  [path: string]: {
    [request in httpRequestTypes]?: (req: express.Request, res: express.Response, next?: express.NextFunction) => void;
  }
}
