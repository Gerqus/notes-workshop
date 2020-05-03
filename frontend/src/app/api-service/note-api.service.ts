import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Note, PartialWith } from 'types';

import { GenericApiService } from './generic-api-service.class';

import { ConfigService } from '../config.service';

export class NoteApiService extends GenericApiService<Note> {
  public indexedChildNotes: {[K: string] : Note['Record'][]} = {};

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

  public getNoteById(searchedNoteId: Note['Record']['_id']): Observable<Note['Record']> {
    console.log('fetch note by id');
    return this._fetchItemById(searchedNoteId);
  }

  public getNotesChildren(parentNote: PartialWith<Note['Record'], '_id'>): Observable<Note['Record'][]> {
    return new Observable<Note['Record'][]>((observer) => {
      if (this.indexedChildNotes[parentNote._id]) {
        observer.next(this.indexedChildNotes[parentNote._id])
      } else {
        this._fetchItemsQuery({parentNote: parentNote._id})
          .subscribe((childNotes) => {
            console.log('for parent id', parentNote._id, 'server returned notes', childNotes);
            this.indexedChildNotes[parentNote._id] = childNotes;
            observer.next(this.indexedChildNotes[parentNote._id])
          });
      }
    });
  }

  public noteHasChildren(parentNote: Note['Record']): Observable<boolean> {
    return this.getNotesChildren(parentNote)
      .pipe(map(childNotes => childNotes.length > 0))
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

  public getTopMostNotes(): Observable<Note['Record'][]> {
    return this._fetchItemsQuery({parentNote: null});
  }

  public moveNote(noteToBeMoved: Note['Record'], newParentId: Note['Record']['_id']) {
    if (newParentId === noteToBeMoved._id) {
      throw new Error('Note can\'t be child of itself. Aborting note moving.');
    }

    noteToBeMoved.parentNote = newParentId;

    const noteSubscription = this._updateItem(noteToBeMoved)
      .subscribe(() => noteSubscription.unsubscribe());
  }
}
