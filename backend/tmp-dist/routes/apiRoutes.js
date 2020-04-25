"use strict";
var express = require("express");
var routesModules = require("../controllers");
var apiRouter = express.Router();
Object.keys(routesModules).forEach(function (controllerName) {
    Object.keys(routesModules[controllerName]).forEach(function (path) {
        apiRouter.use(path, routesModules[controllerName][path]);
    });
});
module.exports = apiRouter;
