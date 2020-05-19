import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { flatMap, tap, map } from 'rxjs/operators';
import { Note } from 'types';
import { compact, some } from 'lodash';

import { ApiService } from '@/services/api-service';
import { NoteIndexRecord } from './note-index-record.class';

@Injectable({
  providedIn: 'root'
})
export class NotesControllerService {
  private openedNotesIdsObservable: BehaviorSubject<Note['Record']['_id'][]> = new BehaviorSubject([]);

  public topNotesParentKey = 'top';
  public isReady = new BehaviorSubject(false);

  private notesIndex: {
    [K: string]: NoteIndexRecord
  } = {};

  constructor(
    private apiService: ApiService,
  ) {
    this.indexNote({_id: this.topNotesParentKey} as Note['Record'])
      .subscribe(() => {
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
    return this.openedNotesIdsObservable.getValue().map(noteId => noteId).includes(noteToCheck._id);
  }

  private addNoteToOpened(noteToOpen: NoteIndexRecord): void {
    const currentList = this.openedNotesIdsObservable.getValue();
    currentList.push(noteToOpen._id);
    const updatedList = currentList; // just for code semantics
    this.openedNotesIdsObservable.next(updatedList);
  }

  private removeNoteFromOpened(noteToCloseIndex: NoteIndexRecord): void {
    const currentList = this.openedNotesIdsObservable.getValue();
    const noteToClosePosition = currentList.map(noteId => noteId).indexOf(noteToCloseIndex._id);
    if (noteToClosePosition !== -1) {
      currentList.splice(noteToClosePosition, 1);
      const updatedList = currentList; // just for code semantics
      this.openedNotesIdsObservable.next(updatedList);
    } else {
      console.error('Note', noteToCloseIndex, 'was never opened, so can\'t close it');
    }
  }

  public getOpenedNotesIdsObservable(): Observable<Note['Record']['_id'][]> {
    return this.openedNotesIdsObservable;
  }

  public saveNote(
    noteToSaveIndexRecord: NoteIndexRecord,
    notesNewTitle: Note['Record']['title'],
    notesNewContent: Note['Record']['content'],
  ): Observable<Note['Record']> {
    return this.updateNote(
      noteToSaveIndexRecord.isLink ? noteToSaveIndexRecord.sourceNoteId : noteToSaveIndexRecord._id,
      { title: notesNewTitle, content: notesNewContent },
    ).pipe(tap(() => {
      if (noteToSaveIndexRecord.isLink) {
        this.updateSourceAndItsLinksInParentsFor(noteToSaveIndexRecord);
      } else {
        this.updateInParent(noteToSaveIndexRecord);
      }
    }))
  }

  public toggleCategory(noteToToggle: NoteIndexRecord): Observable<Note['Record']> {
    return this.updateNote(
      noteToToggle.isLink ? noteToToggle.sourceNoteId : noteToToggle._id,
      { isCategory: !noteToToggle.isCategory },
    ).pipe(tap(() => {
      if (noteToToggle.isLink) {
        this.updateSourceAndItsLinksInParentsFor(noteToToggle);
      } else {
        this.updateInParent(noteToToggle);
      }
    }))
  }

  public moveNote(noteToBeMoved: Note['Record'], newParentId: Note['Record']['_id']): Observable<NoteIndexRecord> {
    if (newParentId === noteToBeMoved._id) {
      console.error('Note can\'t be child of itself. Aborting note moving.');
      return;
    } else if (newParentId === noteToBeMoved.parentNoteId) {
      console.warn('Note already is parent of target note. Aborting note moving.');
      return;
    }
    const newParentIndexRecord = this.getFromIndex(newParentId);
    if (newParentIndexRecord.isLink) {
      console.warn('Can\'t move a note under a link. Aborting note moving.');
      return;
    }
    const oldParentIndexRecord = this.getFromIndex(noteToBeMoved.parentNoteId);
    return this.updateNote(noteToBeMoved._id, {parentNoteId: newParentId})
      .pipe(tap(() => {
        const movedNoteIndexRecord = this.getFromIndex(noteToBeMoved._id);
        this.insertChildIn(newParentIndexRecord, movedNoteIndexRecord);
        this.deleteChildIn(oldParentIndexRecord, movedNoteIndexRecord);
      }));
  }

  private updateNote(
    noteToSaveId: Note['Record']['_id'],
    updateModel: Partial<Note['Model']>,
  ): Observable<NoteIndexRecord> {
    const initialNoteIndex = this.notesIndex[noteToSaveId];

    let needsSending = false;

    const propertiesToUpdate = Object.keys(updateModel);
    propertiesToUpdate.forEach(propertyName => {
      if (initialNoteIndex[propertyName] !== updateModel[propertyName]) {
        needsSending = true;
      }
    });

    if (!needsSending) {
      return of(initialNoteIndex);
    }

    return this.apiService.note.updateNote({
      _id: noteToSaveId,
      ...updateModel
    })
    .pipe(map((updatedNote) => {
      propertiesToUpdate.forEach(propertyName => {
        initialNoteIndex[propertyName] = updatedNote[propertyName]; // to show in browser actual content saved in database after for example sanitization on backend
      });
      return this.getFromIndex(updatedNote._id);
    }));
  }

  public deleteNote(noteToDelete: NoteIndexRecord): Observable<null> {
    return this.deleteNotesLinks(noteToDelete)
      .pipe(flatMap(() => this.deleteNoteWithDescendants(noteToDelete)))
  }

  private deleteNoteWithDescendants(noteToDelete: NoteIndexRecord): Observable<null> {
    return new Observable<null>(subscriber => {
      if (noteToDelete.childNotesIds.getValue().length > 0) {
        forkJoin(
          ...noteToDelete.childNotesIds.getValue().map((childNoteId) => {
            const childNoteIndexRecord = this.getFromIndex(childNoteId);
            return this.deleteNotesLinks(childNoteIndexRecord)
            .pipe(flatMap(() => {
              return this.deleteNoteWithDescendants(childNoteIndexRecord)
            }))
          })
        ).subscribe(() => {
          subscriber.next(null)
          subscriber.complete();
        })
      } else {
        subscriber.next(null);
        subscriber.complete();
      }
    }).pipe(flatMap(() => {
      this.deleteInParent(noteToDelete);
      noteToDelete.childNotesIds.complete();
      delete this.notesIndex[noteToDelete._id];
      this.closeNote(noteToDelete);
      return this.apiService.note.deleteNote(noteToDelete);
    }))
  }

  private deleteNotesLinks(sourceNote: NoteIndexRecord): Observable<null> {
    if (sourceNote.linkNotesIds.length > 0) {
      return forkJoin(
        sourceNote.linkNotesIds.map((linkNoteId) => {
          const linkNoteIndexRecord = this.getFromIndex(linkNoteId);
          this.deleteInParent(linkNoteIndexRecord)
          this.closeNote(linkNoteIndexRecord);
          delete this.notesIndex[linkNoteId];
          return this.apiService.note.deleteNote(linkNoteIndexRecord);
        })
      ).pipe(map(() => {
        return null
      }))
    } else {
      return of(null);
    }
  }

  /**
   *  Creates index record for a note record in internal service notes index.
   *  @param noteToIndex - note for which record will be created
   *  @param [updateParent=true] - if should insert/modify note in it's parent childNotes property. IMPORTANT! If set to false, parent must be notfied later in function that uses #indexNote method to keep notes index up to date reflection of database structure
   */

  private indexNote(noteToIndex: Note['Record'], updateParent = true): Observable<NoteIndexRecord> {
    return new Observable<NoteIndexRecord>(subscriber => {
      this.getSourceNoteIndexFor(noteToIndex)
        .subscribe(sourceNoteIndex => {
          const parentIndex = this.getParentOf(noteToIndex);
          if (!this.notesIndex[noteToIndex._id]) {
            this.notesIndex[noteToIndex._id] = new NoteIndexRecord(noteToIndex);
          }
          const indexedNote = this.notesIndex[noteToIndex._id];
          if (sourceNoteIndex) {
            this.addLinkNoteToIndexRecord(sourceNoteIndex, indexedNote);
          }
          if (updateParent) {
            if (parentIndex && some(parentIndex.childNotesIds.getValue(), (childNoteId) => childNoteId === indexedNote._id)) {
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
    if (!sourceNote.linkNotesIds.includes(linkNote._id)) {
      sourceNote.linkNotesIds.push(linkNote._id);
    }
  }

  public getFromIndex(noteToRetriveId: Note['Record']['_id']): NoteIndexRecord {
    return this.notesIndex[noteToRetriveId] || null;
  }

  public copyNoteShallow(noteToBeCopied: Note['Record'], copyParentId: Note['Record']['_id']): Observable<NoteIndexRecord> {
    const newNoteModel = {
      ...noteToBeCopied,
      parentNoteId: copyParentId,
    };
    delete newNoteModel._id;
    return this.apiService.note.addNote(newNoteModel)
      .pipe(flatMap(newNote => this.indexNote(newNote)))
  }

  public linkNote(sourceNote: Note['Record'], linkParentId: Note['Record']['_id']): Observable<NoteIndexRecord> {
    if (sourceNote.isLink) {
      console.error('Can\'t create link to antoher link. Aborting...');
      return;
    }
    return this.apiService.note.addNote({
      parentNoteId: linkParentId,
      sourceNoteId: sourceNote._id,
      isLink: true,
    }).pipe(flatMap(newNote => this.indexNote(newNote)));
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

  public insertChildrenFromServerFor(parentNote: NoteIndexRecord): Observable<NoteIndexRecord[]> {
    return this.apiService.note.getNotesChildren(parentNote)
        .pipe(flatMap(childNotes => {
          if (childNotes.length) {
            return forkJoin<NoteIndexRecord[]>(
              ...childNotes.map(childNote => this.indexNote(childNote, false))
            )
              .pipe(tap(() => {
                const childrenIds = compact(childNotes.map((childNote) => childNote._id));
                parentNote.childNotesIds.next(childrenIds);
              }));
          } else {
            return of([]);
          }
        }));
  }

  private getParentOf(searchedChildNote: Note['Record']): NoteIndexRecord {
    return this.getFromIndex(searchedChildNote.parentNoteId);
  }

  private updateChildIn(parentNote: NoteIndexRecord, modifiedChild: NoteIndexRecord): void {
    const currentChildrenIds = parentNote.childNotesIds.getValue();
    const childPosition = currentChildrenIds.indexOf(modifiedChild._id);
    if (childPosition === -1) {
      console.error('Child', modifiedChild, 'was not found for parent', parentNote);
    } else {
      currentChildrenIds.splice(childPosition, 1, modifiedChild._id);
      parentNote.childNotesIds.next([...currentChildrenIds]);
    }
  }

  private deleteWithDescendants(parentNoteToDelete: NoteIndexRecord): void {
    parentNoteToDelete.childNotesIds.getValue().forEach(childNoteId => {
      const childIndexRecord = this.getFromIndex(childNoteId);
      this.deleteWithDescendants(childIndexRecord);
    })
    this.deleteInParent(parentNoteToDelete);
  }

  private deleteChildIn(parentNote: NoteIndexRecord, childNoteToDelete: NoteIndexRecord): void {
    const currentChildrenIds = parentNote.childNotesIds.getValue();
    const childPosition = currentChildrenIds.indexOf(childNoteToDelete._id);
    if (childPosition === -1) {
      console.error('Child', childNoteToDelete, 'was not found for parent', parentNote);
    } else {
      currentChildrenIds.splice(childPosition, 1);
      parentNote.childNotesIds.next([...currentChildrenIds]);
    }
  }

  private insertChildIn(parentNote: NoteIndexRecord, childNoteToInsert: NoteIndexRecord): void {
    const currentChildrenIds = parentNote.childNotesIds.getValue();
    const childPosition = currentChildrenIds.indexOf(childNoteToInsert._id);
    if (childPosition !== -1) {
      console.error('Child', childNoteToInsert, 'is already present in parent', parentNote);
    } else {
      currentChildrenIds.push(childNoteToInsert._id);
      parentNote.childNotesIds.next([...currentChildrenIds]);
    }
  }

  private updateInParent(modifiedChild: NoteIndexRecord): void {
    this.updateChildIn(this.getFromIndex(modifiedChild.parentNoteId), modifiedChild);
  }

  private deleteInParent(childToDelete: NoteIndexRecord): void {
    return this.deleteChildIn(this.getFromIndex(childToDelete.parentNoteId), childToDelete);
  }

  private updateSourceAndItsLinksInParentsFor(linkNoteToUpdate: NoteIndexRecord): void {
    this.updateInParent(this.getFromIndex(linkNoteToUpdate.sourceNoteId));
    this.getFromIndex(linkNoteToUpdate.sourceNoteId)
      .linkNotesIds.forEach(siblingLinkNoteId =>
        this.updateInParent(this.getFromIndex(siblingLinkNoteId))
      );
  }

  public getNotePath(noteIndexRecord: NoteIndexRecord): string {
    if (noteIndexRecord._id === this.topNotesParentKey) {
      return '';
    } else {
      return this.getNotePath(this.getFromIndex(noteIndexRecord.parentNoteId)) + '/ ' + noteIndexRecord.title + ' ';
    }
  }
}
