import * as express from 'express';
import { controllerRoutes } from '@/interfaces/controller-routes.interface';

import dbService from '@/services/db.service';
import noteModel, { INoteDocument } from '@/models/note.model';
import { Note, httpRequestTypes } from 'types';
import * as sanitizeHtml from 'sanitize-html';

function noteGet(req: express.Request, res: express.Response) {
  dbService.find(noteModel, req.query)
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
  const newNote: INoteDocument = new noteModel(req.body as Note['Model']);
  console.log('note to be saved', req.body as Note['Model']);
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
    .then(() => {
      console.log(`Note of id "${req.params.noteId}" has been deleted`);
      const toSend: Note['Response'] = {
        message: `Note of id "${req.params.noteId}" has been deleted`,
        object: null,
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

  const sanitizedNote: Partial<Note['Model']> = {};

  if ((req.body as Partial<Note['Record']>).title !== undefined) {
    sanitizedNote.title = sanitizeHtml((req.body as Note['Record']).title, {
      allowedTags: ['span'],
      allowedAttributes: {
        span: ['style'],
      },
    });
  }

  if ((req.body as Partial<Note['Record']>).content !== undefined) {
    sanitizedNote.content = sanitizeHtml((req.body as Note['Record']).content, {
      allowedTags: ['br', 'b', 'img'],
      allowedAttributes: {
        'img': ['src', 'style'],
      },
    });
  }

  if ((req.body as Partial<Note['Record']>).parentNoteId !== undefined) {
    sanitizedNote.parentNoteId = req.body.parentNoteId;
  }

  if ((req.body as Partial<Note['Record']>).isCategory !== undefined) {
    sanitizedNote.isCategory = req.body.isCategory;
  }

  if ((req.body as Partial<Note['Record']>).index !== undefined) {
    sanitizedNote.index = req.body.index;
  }

  console.log('Updating note of id', req.params.noteId, 'to be', sanitizedNote);

  noteModel.findByIdAndUpdate(
    (req.body as Note['Record'])._id,
    sanitizedNote,
    { new: true }
  )
    .then((noteDocument) => {
      const toSend: Note['Response'] = {
        message: `Note of id "${req.params.noteId}" has been updated`,
        object: noteDocument as Note['Record'],
      };
      console.log(toSend);
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
