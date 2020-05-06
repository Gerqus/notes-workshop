import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Note, PartialWith } from 'types';

import { GenericApiService } from './generic-api-service.class';

import { ConfigService } from '../config.service';

export class NoteApiService extends GenericApiService<Note> {
  public indexedChildNotes: {[K: string] : Note['Record'][]} = {};
  public topNotesParentKey = 'top'; //any arbitrary string really that won't collide with acrtual notes ids
  public notesChildrenSubs: {
    [K: string] : Subject<Note['Record'][]>
  } = {};

  constructor(
    configService: ConfigService,
    httpClient: HttpClient,
  ) {
    super(configService, httpClient, configService.api.root, 'note');
    this._updateEndpointItemsIndex();
  }

  public addNote(noteData?: Note['Model']): Observable<Note['Record']> {
    return this._addItem(noteData ? noteData : {} as Note['Model'])
      .pipe(tap((newNote) => this.refreshChildrenFor(newNote.parentNoteId)));
  }

  public getNoteById(searchedNoteId: Note['Record']['_id']): Observable<Note['Record']> {
    return this._fetchItemById(searchedNoteId);
  }

  public getNotesChildren(parentNote: PartialWith<Note['Record'], '_id'>): Observable<Note['Record'][]> {
    return new Observable<Note['Record'][]>((observer) => {
      if (this.indexedChildNotes[parentNote._id]) {
        observer.next(this.indexedChildNotes[parentNote._id])
      } else {
        this._fetchItemsQuery({parentNoteId: parentNote._id})
          .subscribe((childNotes) => {
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

  public deleteNote(note: Note['Record']): Observable<Note['Record']> {
    return this._deleteItem(note._id)
      .pipe(tap(
        () => {
          if (this.notesChildrenSubs[note._id]) {
            this.notesChildrenSubs[note._id].complete();
            delete this.notesChildrenSubs[note._id];
          }
          this.refreshChildrenFor(note.parentNoteId);
        }
      ))
  }

  public updateNote(noteToSave: PartialWith<Note['Record'], '_id'>): Observable<Note['Record']> {
    return this._updateItem(noteToSave)
      .pipe(tap((savedNote) => {this.refreshChildrenFor(savedNote.parentNoteId)}));;
  }

  public getChildNotesListSub(parentNoteId: Note['Record']['_id']): Observable<Note['Record'][]> {
    if (!this.notesChildrenSubs[parentNoteId]) {
      this.notesChildrenSubs[parentNoteId] = new Subject<Note['Record'][]>() ;
    }
    return this.notesChildrenSubs[parentNoteId];
  }

  public refreshChildrenFor(parentNoteId: Note['Record']['_id']): void {
    this._fetchItemsQuery({parentNoteId})
      .subscribe((childNotes) => {
        if (this.notesChildrenSubs[parentNoteId]) { // filtrowanie dla notatek zapisanych po odświeżeniu strony, których rodzic nie został jeszcze załadowany w browserze (pokazany w menu) (w rpzyszłości może też dla notetek, których rodzic został już wyczyszczony z browsera???)
          this.notesChildrenSubs[parentNoteId].next(childNotes);
        }
      });
  }

  public toggleCategory(noteToBeToggled: Note['Record']): Observable<Note['Record']> {
    noteToBeToggled.isCategory = !noteToBeToggled.isCategory;
    return this.updateNote(noteToBeToggled);
  }

  public moveNote(noteToBeMoved: Note['Record'], newParentId: Note['Record']['_id']) {
    if (newParentId === noteToBeMoved._id) {
      throw new Error('Note can\'t be child of itself. Aborting note moving.');
    }
    const oldParentId = noteToBeMoved.parentNoteId;
    noteToBeMoved.parentNoteId = newParentId;

    this._updateItem(noteToBeMoved)
      .pipe(tap(
        () => {
          this.refreshChildrenFor(oldParentId);
          this.refreshChildrenFor(newParentId);
        }
      )).subscribe();
  }
}
