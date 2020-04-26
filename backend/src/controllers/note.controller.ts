import * as express from 'express';
import { controllerRoutes } from '@/interfaces/controller-routes.interface';
import { httpRequestTypes } from '@/interfaces/http-request-types.enum';
import dbService from '@/services/db.service';

export = {
  [httpRequestTypes.POST]: {
    '/note': function (req: express.Request, res: express.Response) {
      dbService.foo = 'baz';
      console.log('1', dbService.foo);
      res.send('{"message": "Note created"}');
    },
  },
} as controllerRoutes;
