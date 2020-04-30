import * as express from 'express';
import { httpRequestTypes } from 'types';

export type controllerRoutes = {
  [path: string]: {
    [request in httpRequestTypes]?: (req: express.Request, res: express.Response, next?: express.NextFunction) => void;
  }
}
