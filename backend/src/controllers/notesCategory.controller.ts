import * as express from 'express';
import { controllerRoutes } from '@/interfaces/controller-routes.interface';

import dbService from '@/services/db.service';
import notesCategoryModel, { INotesCategoryDocument } from '@/models/notesCategory.model';
import { NotesCategory, httpRequestTypes } from 'types';
import * as sanitizeHtml from 'sanitize-html';

function notesCategoryGet(req: express.Request, res: express.Response) {
  dbService.find(notesCategoryModel)
    .then(({response}) => {
      const toSend: NotesCategory['Response'] = {
        message: 'Notes categories fetched',
        object: response,
      };
      console.log(toSend.message);
      res.send(toSend);
    })
    .catch(({error}) => {
      const toSend: NotesCategory['Response'] = {
        message: `Could not fetch notes categories: ${error}`,
        object: null,
      };
      console.log(toSend.message);
      res.send(toSend);
    });
}

function notesCategoryPost(req: express.Request, res: express.Response) {
  const newNotesCategory: INotesCategoryDocument = new notesCategoryModel<NotesCategory['Model']>(req.body as NotesCategory['Model']);
  dbService.save(newNotesCategory)
    .then(({response}) => {
      const toSend: NotesCategory['Response'] = {
        message: 'New notes category has been created',
        object: response,
      };
      console.log(toSend.message);
      res.send(toSend);
    })
    .catch(({error}) => {
      console.error('Could not create notes category:', error);
      const toSend: NotesCategory['Response'] = {
        message: `Could not create notes category: ${error}`,
        object: null,
      };
      res.send(toSend);
    });
}
function notesCategoryDelete(req: express.Request, res: express.Response) {
  console.log('Deleting notes category of id', req.params.noteId);
  dbService.delete(notesCategoryModel, req.params.noteId)
    .then(({response}) => {
      console.log(`Notes category of id "${req.params.noteId}" has been deleted`);
      const toSend: NotesCategory['Response'] = {
        message: `Notes category of id "${req.params.noteId}" has been deleted`,
        object: response,
      };
      res.send(toSend);
    })
    .catch(({error}) => {
      console.error(`Could not delete notes category of id "${req.params.noteId}"`, error);
      const toSend: NotesCategory['Response'] = {
        message: `Could not delete notes category of id "${req.params.noteId}": ${error}`,
        object: null,
      };
      res.send(toSend);
    });
}

function notesCategoryPatch(req: express.Request, res: express.Response) {
  console.log('Updating notes category of id', req.params.noteId);

  const sanitizedNotesCategory: Partial<NotesCategory['Model']> = {
    title: sanitizeHtml((req.body as NotesCategory['Record']).title, { allowedTags: [] }),
  };

  notesCategoryModel.findByIdAndUpdate(
    (req.body as NotesCategory['Record'])._id,
    sanitizedNotesCategory,
    { new: true }
  )
    .then((notesCategoryDocument) => {
      console.log(`Note of id "${req.params.noteId}" has been updated`);
      const toSend: NotesCategory['Response'] = {
        message: `Note of id "${req.params.noteId}" has been updated`,
        object: notesCategoryDocument as NotesCategory['Record'],
      };
      res.send(toSend);
    })
    .catch(({error}) => {
      console.error(`Could not update note of id "${req.params.noteId}"`, error);
      const toSend: NotesCategory['Response'] = {
        message: `Could not update note of id "${req.params.noteId}": ${error}`,
        object: null,
      };
      res.send(toSend);
    });
}

export = {
  '/notes-category': {
    [httpRequestTypes.GET]: notesCategoryGet,
    [httpRequestTypes.POST]: notesCategoryPost,
  },
  '/notes-category/:noteId': {
    [httpRequestTypes.DELETE]: notesCategoryDelete,
    [httpRequestTypes.PATCH]: notesCategoryPatch,
  },
} as controllerRoutes
