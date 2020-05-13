import { Injectable } from '@angular/core';
import { Subscription, BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, flatMap, tap } from 'rxjs/operators';
import { Note } from 'types';
import { compact, some } from 'lodash';

import { ApiService } from '@/services/api-service';
import { NoteIndexRecord } from './note-index-record.class';

type noteActionCallback = (modifiedNote: Note['Record']) => void;

@Injectable({
  providedIn: 'root'
})
export class NotesControllerService {

  private openedNotesObservable: BehaviorSubject<Note['Record'][]> = new BehaviorSubject([]);

  public topNotesParentKey = 'top';
  public isReady = new BehaviorSubject(false);

  private notesIndex: {
    [K: string]: NoteIndexRecord
  } = {};

  static getPositionByNoteId(notesArray: Note['Record'][], noteToFind: Note['Record']): number {
    return notesArray.findIndex((childNote) => {
      return childNote._id === noteToFind._id
    });
  }

  constructor(
    private apiService: ApiService,
  ) {
    this.indexNote({_id: this.topNotesParentKey} as Note['Record'])
      .subscribe(() => {
          console.log(this.notesIndex)
          this.isReady.next(true);
      });
  }

  public openNote(noteToOpen: NoteIndexRecord): void {
    if (!this.isNoteOpened(noteToOpen)) {
      this.addNoteToOpened(noteToOpen);
    }
  }

  public closeNote(noteToCloseIndex: NoteIndexRecord): void {
    if (this.isNoteOpened(noteToCloseIndex)) {
      this.removeNoteFromOpened(noteToCloseIndex);
    }
  }

  public createEmptyNote(): Observable<NoteIndexRecord> {
    return this.apiService.note.addNote().
      pipe(flatMap(newNote => {
        return this.indexNote(newNote);
      }))
  }

  private isNoteOpened(noteToCheck: Note['Record']): boolean{
    return NotesControllerService.getPositionByNoteId(this.openedNotesObservable.getValue(), noteToCheck) !== -1;
  }

  private addNoteToOpened(noteToOpen: NoteIndexRecord): void {
    const currentList = this.openedNotesObservable.getValue();
    currentList.push(noteToOpen);
    const updatedList = currentList; // just for code semantics
    this.openedNotesObservable.next(updatedList);
  }

  private removeNoteFromOpened(noteToCloseIndex: NoteIndexRecord): void {
    const currentList = this.openedNotesObservable.getValue();
    const noteToClosePosition = NotesControllerService.getPositionByNoteId(currentList, noteToCloseIndex);
    if (noteToClosePosition !== -1) {
      currentList.splice(noteToClosePosition, 1);
      const updatedList = currentList; // just for code semantics
      this.openedNotesObservable.next(updatedList);
    } else {
      console.error('Note', noteToCloseIndex, 'was never opened, so can\'t close it');
    }
  }

  public saveNote(
    noteToSaveId: Note['Record']['_id'],
    notesNewTitle: Note['Record']['title'],
    notesNewContent: Note['Record']['content'],
  ): Observable<Note['Record']> {
    return this.updateNote(
      noteToSaveId,
      { title: notesNewTitle, content: notesNewContent },
    )
  }

  public toggleCategory(noteToToggle: NoteIndexRecord): Observable<Note['Record']> {
    return this.updateNote(
      noteToToggle._id,
      { isCategory: !noteToToggle.isCategory },
    )
  }

  private updateNote(
    noteToSaveId: Note['Record']['_id'],
    updateModel: Partial<Note['Model']>,
  ): Observable<Note['Record']> {
    const initialNoteIndex = this.notesIndex[noteToSaveId];

    let needsSending = false;

    const propertiesToUpdate = Object.keys(updateModel);
    propertiesToUpdate.forEach(propertyName => {
      if (initialNoteIndex[propertyName] !== updateModel[propertyName]) {
        needsSending = true;
      }
    });

    if (!needsSending) {
      return of();
    }

    return this.apiService.note.updateNote({
      _id: initialNoteIndex.contentSourceId,
      ...updateModel
    })
    .pipe(tap((updatedNote) => {
      propertiesToUpdate.forEach(propertyName => {
        initialNoteIndex[propertyName] = updatedNote[propertyName]; // to show in browser actual content saved in database after for example sanitization on backend
      });
      if (initialNoteIndex.isLink) {
        this.updateSourceAndItsLinksInParentsFor(initialNoteIndex);
      } else {
        this.updateInParent(initialNoteIndex);
      }
    }));
  }

  public deleteNote(noteToDelete: NoteIndexRecord): Observable<null> {
    return new Observable<null>(subscriber => {
      if (noteToDelete.linkNotes.length > 0) {
        forkJoin(
          ...noteToDelete.linkNotes.map((linkNote) => this.deleteNote(linkNote))
        ).subscribe(() => {
          subscriber.next(null)
          subscriber.complete();
        })
      } else {
        subscriber.next(null);
        subscriber.complete();
      }
    })
    .pipe(flatMap(() => {
      return this.deleteNoteWithDescendants(noteToDelete)
    }))
    .pipe(tap(console.log));
  }

  /**
   *  Creates index record for a note record in internal service notes index.
   *  @param noteToIndex - note for which record will be created
   *  @param [updateParent=true] - if should insert/modify note in it's parent childNotes property. IMPORTANT! If set to false, parent must be notfied later in function that uses #indexNote method to keep notes index up to date reflection of database structure
   */

  private indexNote(noteToIndex: Note['Record'], updateParent = true): Observable<NoteIndexRecord> {
    console.log('indexing', noteToIndex)
    return new Observable<NoteIndexRecord>(subscriber => {
      this.getSourceNoteIndexFor(noteToIndex)
        .subscribe(sourceNoteIndex => {
          const parentIndex = this.getParentOf(noteToIndex);
          if (!this.notesIndex[noteToIndex._id]) {
            this.notesIndex[noteToIndex._id] = new NoteIndexRecord(
              noteToIndex,
              sourceNoteIndex,
              parentIndex,
            );
          }
          const indexedNote = this.notesIndex[noteToIndex._id];
          if (sourceNoteIndex) {
            this.addLinkNoteToIndexRecord(sourceNoteIndex, indexedNote);
          }
          if (updateParent) {
            if (parentIndex && some(parentIndex.childNotes.getValue(), (child) => child._id === indexedNote._id)) {
              this.updateChildIn(parentIndex, indexedNote);
            } else if(parentIndex) {
              this.insertChildIn(parentIndex, indexedNote);
            }
          }
          subscriber.next(indexedNote);
          subscriber.complete();
        })
    })
  }

  private addLinkNoteToIndexRecord(sourceNote: NoteIndexRecord, linkNote: NoteIndexRecord): void {
    if (!sourceNote.linkNotes.includes(linkNote)) {
      sourceNote.linkNotes.push(linkNote);
    }
  }

  public getFromIndex(noteToRetriveId: Note['Record']['_id']): NoteIndexRecord {
    return this.notesIndex[noteToRetriveId] || null;
  }

  public getOpenedNotesObservable(): Observable<Note['Record'][]> {
    return this.openedNotesObservable;
  }

  public indexChildrenFor(parentNote: NoteIndexRecord): Observable<NoteIndexRecord[]> {
    console.group('indexing children for', parentNote._id);
    return this.insertChildrenFromServerFor(parentNote);
  }

  private getSourceNoteIndexFor(linkNote: Note['Record']): Observable<NoteIndexRecord | null> {
    return new Observable<NoteIndexRecord | null>(subscriber => {
      if (linkNote.isLink) {
        const sourceNoteIndex = this.getFromIndex(linkNote.sourceNoteId);
        if (sourceNoteIndex) {
          subscriber.next(sourceNoteIndex);
          subscriber.complete();
        } else {
          this.apiService.note.getSourceNoteFor(linkNote)
            .subscribe((sourceNote) => {
              this.indexNote(sourceNote)
                .subscribe((sourceNoteIndex) => {
                  subscriber.next(sourceNoteIndex);
                  subscriber.complete();
                });
            });
        }
      } else {
        subscriber.next(null);
        subscriber.complete();
      }
    })
  }

  private insertChildrenFromServerFor(parentNote: NoteIndexRecord): Observable<NoteIndexRecord[]> {
    return this.apiService.note.getNotesChildren(parentNote)
        .pipe(flatMap(childNotes => {
          if (childNotes.length) {
            return forkJoin<NoteIndexRecord[]>(
              ...childNotes.map(childNote => this.indexNote(childNote, false))
            )
              .pipe(tap(() => {
                const indexedChildren = compact(childNotes.map((childNote) => this.getFromIndex(childNote._id)));
                parentNote.childNotes.next(indexedChildren);
              }));
          } else {
            return of([]);
          }
        }));
  }

  private getParentOf(searchedChildNote: Note['Record']): NoteIndexRecord {
    return this.getFromIndex(searchedChildNote.parentNoteId);
  }

  private deleteNoteWithDescendants(noteToDelete: NoteIndexRecord): Observable<null> {
    return new Observable<null>(subscriber => {
      if (noteToDelete.childNotes.getValue().length > 0) {
        forkJoin(
          ...noteToDelete.childNotes.getValue().map((childNote) => this.deleteNoteWithDescendants(childNote))
        ).subscribe(() => {
          subscriber.next(null)
          subscriber.complete();
        })
      } else {
        subscriber.next(null);
        subscriber.complete();
      }
    }).pipe(flatMap(() => {
      return this.deleteInParent(noteToDelete)
    }))
  }

  private updateChildIn(parentNote: NoteIndexRecord, modifiedChild: NoteIndexRecord): void {
    const currentChildren = parentNote.childNotes.getValue();
    const childPosition = NotesControllerService.getPositionByNoteId(currentChildren, modifiedChild);
    if (childPosition === -1) {
      console.error('Child', modifiedChild, 'was not found for parent', parentNote);
    } else {
      currentChildren.splice(childPosition, 1, modifiedChild);
      parentNote.childNotes.next(currentChildren);
    }
  }

  private deleteChildIn(parentNote: NoteIndexRecord, childNoteToDelete: NoteIndexRecord): Observable<null> {
    if (childNoteToDelete.childNotes.getValue().length > 0) {
      throw new Error('Can\'t delete note that has children. Aborting...');
    }
    const currentChildren = parentNote.childNotes.getValue();
    const childPosition = NotesControllerService.getPositionByNoteId(currentChildren, childNoteToDelete);
    if (childPosition === -1) {
      console.error('Child', childNoteToDelete, 'was not found for parent', parentNote);
    } else {
      currentChildren.splice(childPosition, 1);
      parentNote.childNotes.next(currentChildren);
      childNoteToDelete.childNotes.complete();
      delete this.notesIndex[childNoteToDelete._id];
      this.closeNote(childNoteToDelete);
      return this.apiService.note.deleteNote(childNoteToDelete);
    }
  }

  private insertChildIn(parentNote: NoteIndexRecord, childNoteToInsert: NoteIndexRecord): void {
    const currentChildren = parentNote.childNotes.getValue();
    const childPosition = NotesControllerService.getPositionByNoteId(currentChildren, childNoteToInsert);
    if (childPosition !== -1) {
      console.error('Child', childNoteToInsert, 'is already present in parent', parentNote);
    } else {
      currentChildren.push(childNoteToInsert);
      parentNote.childNotes.next(currentChildren);
    }
  }

  private updateInParent(modifiedChild: NoteIndexRecord): void {
    this.updateChildIn(modifiedChild.parentNote, modifiedChild);
  }

  private deleteInParent(childToDelete: NoteIndexRecord): Observable<null> {
    return this.deleteChildIn(childToDelete.parentNote, childToDelete);
  }

  private updateSourceAndItsLinksInParentsFor(linkNoteToUpdate: NoteIndexRecord): void {
    this.updateInParent(linkNoteToUpdate.sourceNote);
    linkNoteToUpdate.sourceNote.linkNotes.forEach(siblingLinkNote => this.updateInParent(siblingLinkNote))
  }
}
