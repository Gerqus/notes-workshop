import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Note } from 'types';

import { GenericApiService } from './generic-api-service.class';

import { ConfigService } from '../config.service';

interface indexedNotes {
  [noteId: string]: Note['Record'];
}

export class NoteApiService extends GenericApiService<Note> {
  constructor(
    configService: ConfigService,
    httpClient: HttpClient,
  ) {
    super(configService, httpClient, configService.api.root, 'note');
    this._updateEndpointItemsIndex();
  }

  public addNote(noteToAdd: Note['Model']): Observable<Note['Record']> {
    console.log('add note');
    return this._addItem(noteToAdd)
  }

  // wydaje sie, że na razie żadna część kodu tego nie potrzebuje - cache utrzymywane jest wewnętrznie
  // public fetchAllNotes(): Observable<Note['Record'][]> {
  //   console.log('fetch notes');
  //   return this._fetchAll();
  // }

  public fetchNoteById(searchedNoteId: Note['Record']['_id']): Promise<Note['Record']> {
    console.log('fetch note by id');
    return this._fetchItemById(searchedNoteId);
  }

  public deleteNoteById(noteId: Note['Record']['_id']): Observable<Note['Record']> {
    console.log('delete note');
    return this._deleteItem(noteId);
  }

  public saveNote(noteToSave: Note['Record']): Observable<Note['Record']> {
    console.log('save note');
    if (!noteToSave.title) {
      throw new Error('Note must have a title. Aborting note saving.');
    }
    return this._updateItem(noteToSave);
  }

  public getNotesListSubject(): Subject<Note['Record'][]> {
    return this._getIndexedItemsSubject();
  }
}
