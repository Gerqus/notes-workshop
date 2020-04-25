import * as express from 'express';
import { httpRequestTypes } from './http-request-types.enum';

export type controllerRoutes = {
  [request in httpRequestTypes]?: {
    [path: string]: (req: express.Request, res: express.Response, next?: express.NextFunction) => void;
  }
}
