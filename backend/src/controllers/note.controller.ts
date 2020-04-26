import * as express from 'express';
import { controllerRoutes } from '@/interfaces/controller-routes.interface';
import { httpRequestTypes } from '@/interfaces/http-request-types.enum';

export = {
  [httpRequestTypes.POST]: {
    '/note': function (req: express.Request, res: express.Response) {
      res.send('{"message": "Note created"}');
    },
  },
} as controllerRoutes;
