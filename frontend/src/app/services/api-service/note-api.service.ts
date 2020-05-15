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

  public addNote(noteData?: Note['Model']): Observable<Note['Record']> {
    return this._addItem(noteData ? noteData : {} as Note['Model'])
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

  public noteHasChildren(parentNote: Note['Record']): Observable<boolean> {
    return this.getNotesChildren(parentNote)
      .pipe(map(childNotes => childNotes.length > 0))
  }

  public deleteNote(note: Note['Record']): Observable<null> {
      return this._deleteItem(note);
  }

  public updateNote(noteToSave: PartialWith<Note['Record'], '_id'>): Observable<Note['Record']> {
    return this._updateItem(noteToSave);
  }

  public toggleCategory(noteToBeToggled: Note['Record']): Observable<Note['Record']> {
    return this.updateNote(noteToBeToggled)
  }

  public copyNoteShallow(noteToBeCopied: Note['Record'], copyParentId: Note['Record']['_id']) {
    this._copyItem(noteToBeCopied)
      .subscribe((newNote) => {
        newNote.parentNoteId = copyParentId;
        this._updateItem(newNote)
          .subscribe();
      });
  }

  public linkNote(noteToBeLinked: Note['Record'], linkParentId: Note['Record']['_id']): void {
    if (noteToBeLinked.isLink) {
      console.error('Can\'t create link to antoher link. Aborting...');
      return;
    }
    const noteLinkToCreate: PartialWith<Note['Model'], 'parentNoteId'> = {
      parentNoteId: linkParentId,
      sourceNoteId: noteToBeLinked._id,
      isLink: true,
    };
    this._addItem(noteLinkToCreate).subscribe();
  }
}
