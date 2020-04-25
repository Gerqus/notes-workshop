import { controllerRoutes } from 'src/interfaces/controller-routes.interface';

export = {
  noteController: require('./note.controller'),
} as {
  [controllerName: string]: controllerRoutes
}
