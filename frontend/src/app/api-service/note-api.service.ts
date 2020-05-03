import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Note, PartialWith } from 'types';

import { GenericApiService } from './generic-api-service.class';

import { ConfigService } from '../config.service';

export class NoteApiService extends GenericApiService<Note> {
  constructor(
    configService: ConfigService,
    httpClient: HttpClient,
  ) {
    super(configService, httpClient, configService.api.root, 'note');
    this._updateEndpointItemsIndex();
  }

  public addNote(): Observable<Note['Record']> {
    console.log('add note');
    return this._addItem({} as Note['Model']);
  }

  // wydaje sie, że na razie żadna część kodu tego nie potrzebuje - cache utrzymywane jest wewnętrznie
  // public fetchAllNotes(): Observable<Note['Record'][]> {
  //   console.log('fetch notes');
  //   return this._fetchAll();
  // }

  public fetchNoteById(searchedNoteId: Note['Record']['_id']): Observable<Note['Record']> {
    console.log('fetch note by id');
    return this._fetchItemById(searchedNoteId);
  }

  public deleteNoteById(noteId: Note['Record']['_id']): Observable<Note['Record']> {
    console.log('delete note');
    return this._deleteItem(noteId);
  }

  public saveNote(noteToSave: PartialWith<Note['Record'], '_id'>): Observable<Note['Record']> {
    console.log('save note');
    if (!noteToSave.title) {
      throw new Error('Note must have a title. Aborting note saving.');
    }
    return this._updateItem(noteToSave);
  }

  public getNotesListSubject(): Subject<Note['Record'][]> {
    return this._getIndexedItemsSubject();
  }

  public moveNote(noteToBeMoved: Note['Record'], oldParentNote: Note['Record'] | null, newParentNote: Note['Record']) {
    if (newParentNote._id === noteToBeMoved._id) {
      throw new Error('Note can\'t be child of itself. Aborting note moving.');
    }
    newParentNote.childNotes.push(noteToBeMoved._id);

    if (oldParentNote) {
      const movedNoteIndex = oldParentNote.childNotes.indexOf(noteToBeMoved._id);
      if (movedNoteIndex === -1) {
        throw new Error('Index of child note was not found in parent note. Something is messed. Aborting note moving.');
      }
      oldParentNote.childNotes.splice(movedNoteIndex, 1);

      const notesSubscription = this._updateItems([oldParentNote, newParentNote])
        .subscribe(() => notesSubscription.unsubscribe());
    } else {
      const newParentNoteSubscription = this._updateItem(newParentNote)
        .subscribe(() => newParentNoteSubscription.unsubscribe());
    }
  }
}
