import * as express from 'express';
import { controllerRoutes } from '@/interfaces/controller-routes.interface';

import dbService from '@/services/db.service';
import noteModel, { INoteDocument } from '@/models/note.model';
import { Note, httpRequestTypes } from 'types';
import * as sanitizeHtml from 'sanitize-html';

function noteGet(req: express.Request, res: express.Response) {
  dbService.find(noteModel)
    .then(({response}) => {
      console.log('Notes fetched');
      const toSend: Note['Response'] = {
        message: 'Notes fetched',
        object: response,
      };
      res.send(toSend);
    })
    .catch(({error}) => {
      console.error('Could not fetch notes', error);
      const toSend: Note['Response'] = {
        message: `Could not fetch notes: ${error}`,
        object: null,
      };
      res.send(toSend);
    });
}

function notePost(req: express.Request, res: express.Response) {
  const newNote: INoteDocument = new noteModel<Note['Model']>(req.body as Note['Model']);
  dbService.save(newNote)
    .then(({response}) => {
      console.log('New note has been created');
      const toSend: Note['Response'] = {
        message: 'New note has been created',
        object: response,
      };
      res.send(toSend);
    })
    .catch(({error}) => {
      console.error('Could not create note:', error);
      const toSend: Note['Response'] = {
        message: `Could not create note: ${error}`,
        object: null,
      };
      res.send(toSend);
    });
}
function noteDelete(req: express.Request, res: express.Response) {
  console.log('Deleting note of id', req.params.noteId);
  dbService.delete(noteModel, req.params.noteId)
    .then(({response}) => {
      console.log(`Note of id "${req.params.noteId}" has been deleted`);
      const toSend: Note['Response'] = {
        message: `Note of id "${req.params.noteId}" has been deleted`,
        object: response,
      };
      res.send(toSend);
    })
    .catch(({error}) => {
      console.error(`Could not delete note of id "${req.params.noteId}"`, error);
      const toSend: Note['Response'] = {
        message: `Could not delete note of id "${req.params.noteId}": ${error}`,
        object: null,
      };
      res.send(toSend);
    });
}

function notePatch(req: express.Request, res: express.Response) {
  console.log('Updating note of id', req.params.noteId);

  const sanitizedNote: Note['Model'] = {
    title: sanitizeHtml((req.body as Note['Record']).title, { allowedTags: [] }),
    content: sanitizeHtml((req.body as Note['Record']).content),
  };

  noteModel.findByIdAndUpdate(
    (req.body as Note['Record'])._id,
    sanitizedNote,
    { new: true }
  )
    .then((noteDocument) => {
      console.log(`Note of id "${req.params.noteId}" has been updated`);
      const toSend: Note['Response'] = {
        message: `Note of id "${req.params.noteId}" has been updated`,
        object: noteDocument as Note['Record'],
      };
      res.send(toSend);
    })
    .catch(({error}) => {
      console.error(`Could not update note of id "${req.params.noteId}"`, error);
      const toSend: Note['Response'] = {
        message: `Could not update note of id "${req.params.noteId}": ${error}`,
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
