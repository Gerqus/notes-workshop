import * as express from 'express';

export = {
  '/note': function (req: express.Request, res: express.Response) {
    res.send(['foo', 'bar', 'baz'].toString());
  },
}
