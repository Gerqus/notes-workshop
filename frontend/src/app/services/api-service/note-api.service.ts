import { HttpClient } from '@angular/common/http';
import * as rxjs from 'rxjs';
import { Observable, Subject, merge } from 'rxjs';
import { map, tap, mergeMap } from 'rxjs/operators';
import { Note, PartialWith } from 'types';

import { GenericApiService } from './generic-api-service.class';

import { ConfigService } from '../config-service';

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
    return this._fetchItemById(searchedNoteId)
      .pipe(mergeMap((fetchedNote) => {
        if (!fetchedNote) {
          return rxjs.of(null);
        }
        return new Observable<Note['Record']>((subscriber) => {
          if (fetchedNote.isLink) {
            this.getOriginalNote(fetchedNote)
            .pipe(map(originalNote => this.formatOriginalNoteFromLink(originalNote, fetchedNote)))
            .subscribe((formatedNote) => {
              subscriber.next(formatedNote);
              subscriber.complete();
            })
          } else {
            subscriber.next(fetchedNote);
            subscriber.complete();
          }
        })
      }));
  }

  private getOriginalNote(linkNote: Note['Record']): Observable<Note['Record']> {
    return this.getNoteById(linkNote.originalNoteId)
  }

  private formatOriginalNoteFromLink(originalNote: Note['Record'], linkNote: Note['Record']): Note['Record'] {
    return {
      _id: linkNote._id,
      parentNoteId: linkNote.parentNoteId,
      originalNoteId: linkNote.originalNoteId,
      isLink: linkNote.isLink,
      title: originalNote.title,
      content: originalNote.content,
      isCategory: originalNote.isCategory
    }
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

  public deleteNote(note: Note['Record']): Observable<null> {
    return new Observable<null>(subscriber => {
      merge(
        this.getNotesLinks(note),
        this.getNotesChildren(note)
      ).subscribe((notesToDelete) => {
        if(notesToDelete.length) {
          console.log(notesToDelete)
          rxjs.forkJoin(
            ...notesToDelete.map((link) => {
              return this.deleteNote(link)
                .pipe(tap(() => this.handleNoteDeletion(link)))
            })
          )
          .subscribe(() => {
            subscriber.next();
            subscriber.complete();
          })
        } else {
          subscriber.next();
          subscriber.complete();
        }
      });
    })
    .pipe(tap(() => {
      this._deleteItem(note)
        .pipe(tap(() => this.handleNoteDeletion(note)))
        .subscribe()
    }));
  }

  private getNotesLinks(originalNote: Note['Record']): Observable<Note['Record'][]> {
    return this._fetchItemsQuery({
      originalNoteId: originalNote._id,
      isLink: true,
    });
  }

  private handleNoteDeletion(note) {
    if (this.notesChildrenSubs[note._id]) {
      this.notesChildrenSubs[note._id].complete();
      delete this.notesChildrenSubs[note._id];
    }
    this.refreshChildrenFor(note.parentNoteId);
  }

  public updateNote(noteToSave: PartialWith<Note['Record'], '_id'>): Observable<Note['Record']> {
    return this._updateItem(noteToSave)
      .pipe(tap((savedNote) => {this.refreshDependantsFor(savedNote)}));
  }

  public getChildNotesListSub(parentNoteId: Note['Record']['_id']): Observable<Note['Record'][]> {
    if (!this.notesChildrenSubs[parentNoteId]) {
      this.notesChildrenSubs[parentNoteId] = new Subject<Note['Record'][]>() ;
    }
    return this.notesChildrenSubs[parentNoteId];
  }

  public refreshDependantsFor(note: Note['Record']) {
    this.refreshChildrenFor(note.parentNoteId);
    this.refreshLinksParentsFor(note);
  }

  public refreshLinksParentsFor(note: Note['Record']) {
    this.getNotesLinks(note)
      .pipe(map((linkNotes) => [...new Set(linkNotes.map(note => note.parentNoteId))]))
      .subscribe(linkParentNoteIds => {
        linkParentNoteIds.forEach(linkParentNoteId => {
          this.refreshChildrenFor(linkParentNoteId)
        });
      });
  }

  public refreshChildrenFor(parentNoteId: Note['Record']['_id']): void {
    this._fetchItemsQuery({parentNoteId})
      .subscribe((childNotes) => {
        if (this.notesChildrenSubs[parentNoteId]) { // filtrowanie dla notatek zapisanych po odświeżeniu strony, których rodzic nie został jeszcze załadowany w browserze (pokazany w menu) (w rpzyszłości może też dla notetek, których rodzic został już wyczyszczony z browsera???)
          if (!childNotes.length) {
            this.notesChildrenSubs[parentNoteId].next(childNotes);
          } else {
            rxjs.forkJoin<Note['Record']>(
              ...childNotes.map(note => {
                if (note.isLink) {
                  return new Observable<Note['Record']>(subscriber => {
                    this.getOriginalNote(note)
                      .pipe(map(originalNote => this.formatOriginalNoteFromLink(originalNote, note)))
                      .subscribe((formatedNote) => {
                        subscriber.next(formatedNote);
                        subscriber.complete();
                      });
                  })
                } else {
                  return rxjs.of(note);
                }
              })
            )
            .subscribe(originalChildNotes => {
              this.notesChildrenSubs[parentNoteId].next(originalChildNotes);
            })
          }
        }
      });
  }

  public toggleCategory(noteToBeToggled: Note['Record']): Observable<Note['Record']> {
    noteToBeToggled.isCategory = !noteToBeToggled.isCategory;
    return new Observable<Note['Record']>(subscriber => {
      if (noteToBeToggled.isLink) {
        this.getOriginalNote(noteToBeToggled)
          .subscribe(originalNote => {
            console.log('original note', originalNote)
            originalNote.isCategory = !originalNote.isCategory;
            subscriber.next(originalNote);
          })
      }
      else {
        subscriber.next(noteToBeToggled);
      }
    }).pipe(mergeMap(fetchedNote => {
      return this.updateNote(fetchedNote)
    }))
    .pipe(tap((changedNote) => {
      this.refreshDependantsFor(changedNote);
    }));
  }

  public moveNote(noteToBeMoved: Note['Record'], newParentId: Note['Record']['_id']) {
    if (newParentId === noteToBeMoved._id) {
      console.error('Note can\'t be child of itself. Aborting note moving.');
      return;
    } else if (newParentId === noteToBeMoved.parentNoteId) {
      console.warn('Note already is parent of target note. Aborting note moving.');
      return;
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

  public copyNoteShallow(noteToBeCopied: Note['Record'], copyParentId: Note['Record']['_id']) {
    console.log('copying note', noteToBeCopied._id, 'under', copyParentId);
    this._copyItem(noteToBeCopied)
      .subscribe((newNote) => {
        newNote.parentNoteId = copyParentId;
        this._updateItem(newNote)
          .subscribe(() => {this.refreshChildrenFor(copyParentId)});
      });
  }

  public linkNote(noteToBeLinked: Note['Record'], linkParentId: Note['Record']['_id']): void {
    if (noteToBeLinked.isLink) {
      console.error('Cant create nested link to antoher link. Aborting...');
      return;
    }
    const noteLinkToCreate: PartialWith<Note['Model'], 'parentNoteId'> = {
      parentNoteId: linkParentId,
      originalNoteId: noteToBeLinked._id,
      isLink: true,
    };
    this._addItem(noteLinkToCreate)
      .subscribe(() => this.refreshChildrenFor(linkParentId));
  }
}
