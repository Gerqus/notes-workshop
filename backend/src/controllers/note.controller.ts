import * as express from 'express';
import { controllerRoutes } from '@/interfaces/controller-routes.interface';
import { httpRequestTypes } from '@/interfaces/http-request-types.enum';

import dbService from '@/services/db.service';
import noteModel, { INoteDocument } from '@/models/note.model';
import { INoteModel, INoteResponse, INoteRecord } from 'types';

function noteGet(req: express.Request, res: express.Response) {
  console.log('Called endpoint GET', req.url);
  dbService.find(noteModel)
    .then(({response}) => {
      console.log('Notes fetched');
      const toSend: INoteResponse = {
        message: 'Notes fetched',
        object: response,
      };
      res.send(toSend);
    })
    .catch(({error}) => {
      console.error('Could not fetch notes', error);
      const toSend: INoteResponse = {
        message: `Could not fetch notes: ${error}`,
        object: null,
      };
      res.send(toSend);
    });
}

function notePost(req: express.Request, res: express.Response) {
  console.log('Called endpoint POST', req.url);
  const newNote: INoteDocument = new noteModel<INoteModel>(req.body as INoteModel);
  dbService.save(newNote)
    .then(({response}) => {
      console.log('New note has been created');
      const toSend: INoteResponse = {
        message: 'New note has been created',
        object: response,
      };
      res.send(toSend);
    })
    .catch(({error}) => {
      console.error('Could not create note:', error);
      const toSend: INoteResponse = {
        message: `Could not create note: ${error}`,
        object: null,
      };
      res.send(toSend);
    });
}
function noteDelete(req: express.Request, res: express.Response) {
  console.log('Called endpoint DELETE', req.url);
  console.log('Deleting note of id', req.params.noteId);
  dbService.delete(noteModel, req.params.noteId)
    .then(({response}) => {
      console.log(`Note of id "${req.params.noteId}" has been deleted`);
      const toSend: INoteResponse = {
        message: `Note of id "${req.params.noteId}" has been deleted`,
        object: response,
      };
      res.send(toSend);
    })
    .catch(({error}) => {
      console.error(`Could not delete note of id "${req.params.noteId}"`, error);
      const toSend: INoteResponse = {
        message: `Could not delete note of id "${req.params.noteId}": ${error}`,
        object: null,
      };
      res.send(toSend);
    });
}

function notePatch(req: express.Request, res: express.Response) {
  console.log('Called endpoint PATH', req.url);
  console.log('Updating note of id', req.params.noteId);
  noteModel.findByIdAndUpdate(
    {_id: (req.body as INoteRecord)._id},
    req.body as INoteRecord,
    { new: true }
  )
    .then((noteDocument) => {
      console.log(`Note of id "${req.params.noteId}" has been deleted`);
      const toSend: INoteResponse = {
        message: `Note of id "${req.params.noteId}" has been deleted`,
        object: noteDocument as INoteRecord,
      };
      res.send(toSend);
    })
    .catch(({error}) => {
      console.error(`Could not delete note of id "${req.params.noteId}"`, error);
      const toSend: INoteResponse = {
        message: `Could not delete note of id "${req.params.noteId}": ${error}`,
        object: null,
      };
      res.send(toSend);
    });
}

export = {
  '/note': {
    [httpRequestTypes.GET]: noteGet,
    [httpRequestTypes.POST]: notePost,
  },
  '/note/:noteId': {
    [httpRequestTypes.DELETE]: noteDelete,
    [httpRequestTypes.PATCH]: notePatch,
  },
} as controllerRoutes
