import { HttpClient } from '@angular/common/http';
import * as rxjs from 'rxjs';
import { Observable } from 'rxjs';
import { map, tap, mergeMap } from 'rxjs/operators';
import { Note, PartialWith } from 'types';

import { GenericApiService } from './generic-api-service.class';

import { ConfigService } from '../config-service';

export class NoteApiService extends GenericApiService<Note> {
  constructor(
    configService: ConfigService,
    httpClient: HttpClient,
  ) {
    super(configService, httpClient, configService.api.root, 'note');
  }

  public addNote(noteData?: Partial<Note['Model']>): Observable<Note['Record']> {
    return this._addItem(noteData ? noteData : {})
  }

  public getNoteById(searchedNoteId: Note['Record']['_id']): Observable<Note['Record']> {
    return this._fetchItemById(searchedNoteId)
      .pipe(map((fetchedNote) => {
        return fetchedNote || null;
      }));
  }

  public getSourceNoteFor(linkNote: PartialWith<Note['Record'], 'sourceNoteId'>): Observable<Note['Record']> {
    return this.getNoteById(linkNote.sourceNoteId)
  }

  public getNotesChildren(parentNote?: PartialWith<Note['Record'], '_id'>): Observable<Note['Record'][]> {
    return this._fetchItemsQuery({parentNoteId: parentNote._id});
  }

  public deleteNote(note: Note['Record']): Observable<null> {
      return this._deleteItem(note);
  }

  public updateNote(noteToSave: PartialWith<Note['Record'], '_id'>): Observable<Note['Record']> {
    return this._updateItem(noteToSave);
  }
}
