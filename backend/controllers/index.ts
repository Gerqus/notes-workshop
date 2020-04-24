import express = require('express');

interface controllerRoutes {
  [path: string]: (req: express.Request, res: express.Response, next?: express.NextFunction) => void;
}

export = {
  noteController: require("./note.controller"),
} as {
  [controllerName: string]: controllerRoutes
}
