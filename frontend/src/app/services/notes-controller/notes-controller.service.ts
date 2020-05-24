import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { flatMap, tap, map, mapTo, delayWhen } from 'rxjs/operators';
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
    (window as any).notesIndex = this.notesIndex;
    this.indexNote({_id: this.topNotesParentKey} as Note['Record'], false)
      .subscribe(() => {
        this.isReady.next(true);
      });
  }

  public openNote(noteToOpen: NoteIndexRecord): void {
    if (!this.isNoteOpened(noteToOpen._id)) {
      this.addNoteToOpened(noteToOpen);
    }
  }

  public closeNote(noteId: Note['Record']['_id']): void {
    if (this.isNoteOpened(noteId)) {
      this.removeNoteFromOpened(noteId);
    }
  }

  public createEmptyNote(): Observable<NoteIndexRecord> {
    return this.apiService.note.addNote().
      pipe(flatMap(newNote => {
        return this.indexNote(newNote);
      }))
  }

  private isNoteOpened(noteId: Note['Record']['_id']): boolean{
    return this.openedNotesIdsObservable.getValue().map(noteId => noteId).includes(noteId);
  }

  private addNoteToOpened(noteToOpen: NoteIndexRecord): void {
    const currentList = this.openedNotesIdsObservable.getValue();
    currentList.push(noteToOpen._id);
    const updatedList = currentList; // just for code semantics
    this.openedNotesIdsObservable.next(updatedList);
  }

  private removeNoteFromOpened(noteToCloseId: Note['Record']['_id']): void {
    const currentList = this.openedNotesIdsObservable.getValue();
    const noteToClosePosition = currentList.map(noteId => noteId).indexOf(noteToCloseId);
    if (noteToClosePosition !== -1) {
      currentList.splice(noteToClosePosition, 1);
      const updatedList = currentList; // just for code semantics
      this.openedNotesIdsObservable.next(updatedList);
    } else {
      console.error('Note', noteToCloseId, 'was not opened, so can\'t close it');
    }
  }

  public getOpenedNotesIdsObservable(): Observable<Note['Record']['_id'][]> {
    return this.openedNotesIdsObservable;
  }

  public saveNote(noteId: Note['Record']['_id']): Observable<Note['Record']> {
    const saveRequestNoteRecord = this.getFromIndex(noteId);
    const noteToSaveIndexRecord = saveRequestNoteRecord.isLink ? this.getFromIndex(saveRequestNoteRecord.sourceNoteId) : saveRequestNoteRecord;
    return this.apiService.note.updateNote({
      _id: noteToSaveIndexRecord._id,
      title: noteToSaveIndexRecord.title,
      content: noteToSaveIndexRecord.content,
    });
  }

  // public saveNote(
  //   noteToSaveIndexRecord: NoteIndexRecord,
  //   notesNewTitle: Note['Record']['title'],
  //   notesNewContent: Note['Record']['content'],
  // ): Observable<Note['Record']> {
  //   return this.updateNote(
  //     noteToSaveIndexRecord.isLink ? noteToSaveIndexRecord.sourceNoteId : noteToSaveIndexRecord._id,
  //     { title: notesNewTitle, content: notesNewContent },
  //   ).pipe(tap(() => {
  //     if (noteToSaveIndexRecord.isLink) {
  //       this.updateSourceAndItsLinksInParentsFor(noteToSaveIndexRecord);
  //     } else {
  //       this.updateInParent(noteToSaveIndexRecord);
  //     }
  //   }))
  // }

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

  public moveNote(noteToBeMoved: Note['Record'], newParentId: Note['Record']['_id'], noteDropOrderIndex?: Note['Record']['index']): Observable<NoteIndexRecord> {
    noteDropOrderIndex = noteDropOrderIndex || 0;
    const noteToBeMovedIndexRecord = this.getFromIndex(noteToBeMoved._id);
    if (newParentId === noteToBeMoved._id) {
      console.error('Note can\'t be child of itself. Aborting note moving.');
      return of(noteToBeMovedIndexRecord);
    } else if (newParentId === noteToBeMoved.parentNoteId) {
      return of(noteToBeMovedIndexRecord);
    }
    const newParentIndexRecord = this.getFromIndex(newParentId);
    if (newParentIndexRecord.isLink) {
      return of(noteToBeMovedIndexRecord);
    }
    const oldParentIndexRecord = this.getFromIndex(noteToBeMoved.parentNoteId);
    const positionInOldParent = this.getPositionInParent(noteToBeMovedIndexRecord);
    return this.updateNote(noteToBeMoved._id, {parentNoteId: newParentId, index: noteDropOrderIndex})
      .pipe(tap(() => {
        const movedNoteIndexRecord = this.getFromIndex(noteToBeMoved._id);
        this.deleteChildIn(oldParentIndexRecord, movedNoteIndexRecord);
      }))
      .pipe(delayWhen((movedNoteIndexRecord) => this.insertChildIn(newParentIndexRecord, movedNoteIndexRecord, noteDropOrderIndex)))
      .pipe(delayWhen(() => this.refreshChildrenOrderIndexies(oldParentIndexRecord, positionInOldParent)));
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
      this.closeNote(noteToDelete._id);
      return this.apiService.note.deleteNote(noteToDelete);
    }))
  }

  private deleteNotesLinks(sourceNote: NoteIndexRecord): Observable<null> {
    if (sourceNote.linkNotesIds.length > 0) {
      return forkJoin(
        sourceNote.linkNotesIds.map((linkNoteId) => {
          const linkNoteIndexRecord = this.getFromIndex(linkNoteId);
          this.deleteInParent(linkNoteIndexRecord)
          this.closeNote(linkNoteIndexRecord._id);
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
   * Creates index record for a note record in internal service notes index.
   * @param noteToIndex - note for which record will be created
   * @param [updateParent=true] - if should insert/modify note in it's parent childNotes property. IMPORTANT! If set to false, parent must be notfied later in function that uses #indexNote method to keep notes index up to date reflection of database structure
   */

  private indexNote(noteToIndex: Note['Record'], updateParent = true): Observable<NoteIndexRecord> {
    if (!this.notesIndex[noteToIndex._id]) {
      this.notesIndex[noteToIndex._id] = new NoteIndexRecord(noteToIndex);
    }
    const indexedNote = this.notesIndex[noteToIndex._id];

    let observable = this.getSourceNoteIndexFor(noteToIndex)
      .pipe(
        tap(sourceNoteIndex => {
          if (sourceNoteIndex) {
            this.addLinkNoteToIndexRecord(sourceNoteIndex, indexedNote);
          }
        }),
        mapTo(indexedNote)
      );
    if (updateParent) {
      const parentIndex = this.getParentOf(noteToIndex);
      if (this.getPositionInParent(indexedNote) !== -1) {
        observable = observable.pipe(tap(() => this.updateInParent(indexedNote)))
      } else {
        observable = observable.pipe(delayWhen(() => this.insertChildIn(parentIndex, indexedNote)));
      }
    }
    return observable;
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

  public insertChildrenFromServerFor(noteToIndexChildrenIn: NoteIndexRecord): Observable<NoteIndexRecord[]> {
    return this.apiService.note.getNotesChildren(noteToIndexChildrenIn)
      .pipe(flatMap(childNotes => {
        if (childNotes.length) {
          return forkJoin<NoteIndexRecord[]>(
            ...childNotes.map(childNote => this.indexNote(childNote, false))
          ).pipe(tap(() => {
            const childrenIds = compact(childNotes.map((childNote) => childNote._id));
            this.setChildrenOf(noteToIndexChildrenIn, childrenIds);
            this.sortChildrenOf(noteToIndexChildrenIn);
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
    if (currentChildrenIds.includes(modifiedChild._id)) {
      console.error('Child', modifiedChild, 'was not found for parent', parentNote);
    } else {
      this.setChildrenOf(parentNote, [...currentChildrenIds]);
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
      this.setChildrenOf(parentNote, [...currentChildrenIds]);
    }
  }

  private insertChildIn(parentNote: NoteIndexRecord, childNoteToInsert: NoteIndexRecord, noteDropOrderIndex?: Note['Record']['index']): Observable<void> {
    noteDropOrderIndex = noteDropOrderIndex || 0;
    const currentChildrenIds = parentNote.childNotesIds.getValue();
    const childPosition = currentChildrenIds.indexOf(childNoteToInsert._id);
    if (childPosition !== -1) {
      console.error('Child', childNoteToInsert, 'is already present in parent', parentNote);
    } else {
      if (noteDropOrderIndex === 0) {
        currentChildrenIds.unshift(childNoteToInsert._id);
      } else if (noteDropOrderIndex === currentChildrenIds.length) {
        currentChildrenIds.push(childNoteToInsert._id)
      } else {
        currentChildrenIds.splice(noteDropOrderIndex, 0, childNoteToInsert._id); // performance. Unshift/push are much fister than splice
      }
      this.sortChildrenOf(parentNote);
      return this.refreshChildrenOrderIndexies(parentNote, noteDropOrderIndex)
      .pipe(tap(() => {
        this.setChildrenOf(parentNote, [...currentChildrenIds]);
      }));
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

  public getNotePath(noteIndexRecord: NoteIndexRecord): string[] {
    const notePath = [];
    let currNote = noteIndexRecord;
    do {
      notePath.unshift(currNote.title);
      currNote = this.getFromIndex(currNote.parentNoteId);
    } while(currNote._id !== this.topNotesParentKey);
    return notePath;
  }

  public reorderNoteInParent(noteToReorder: Note['Record'], newPositionIndex: Note['Record']['index']): Observable<NoteIndexRecord> {
    const noteToReorderIndexRecord = this.getFromIndex(noteToReorder._id);
    const targetParentNote = this.getFromIndex(noteToReorder.parentNoteId);
    const siblingsIds = targetParentNote.childNotesIds.getValue();
    const movedNoteInitialPosition = this.getPositionInParent(noteToReorderIndexRecord);

    if (newPositionIndex > movedNoteInitialPosition) {
      siblingsIds.splice(newPositionIndex, 0, noteToReorderIndexRecord._id);
      siblingsIds.splice(movedNoteInitialPosition, 1);
    } else {
      siblingsIds.splice(movedNoteInitialPosition, 1);
      siblingsIds.splice(newPositionIndex, 0, noteToReorderIndexRecord._id);
    }

    const updateStartIndex = Math.min(newPositionIndex, movedNoteInitialPosition);
    return this.refreshChildrenOrderIndexies(targetParentNote, updateStartIndex)
      .pipe(mapTo(noteToReorderIndexRecord));
  }

  private refreshChildrenOrderIndexies(parentToWorkOn: NoteIndexRecord, updateStartIndex: Note['Record']['index']): Observable<void> {
    const childrenIds = parentToWorkOn.childNotesIds.getValue();
    return forkJoin(
      ...childrenIds.slice(updateStartIndex).map((siblingId, siblingIndex) => this.updateNote(siblingId, { index: siblingIndex + updateStartIndex }))
    )
    .pipe(tap(() => {
      this.setChildrenOf(parentToWorkOn, [...childrenIds]);
    }));
  }

  private getPositionInParent(childNote: NoteIndexRecord): number {
    const siblings = this.getFromIndex(childNote.parentNoteId).childNotesIds.getValue();
    return siblings.indexOf(childNote._id);
  }

  private sortChildrenOf(parentNote: NoteIndexRecord): void {
    const newChildrenArray = parentNote.childNotesIds.getValue();
    newChildrenArray.sort((a, b) => {
      return this.getFromIndex(a).index - this.getFromIndex(b).index;
    });
    this.setChildrenOf(parentNote, [...newChildrenArray]);
  }

  private setChildrenOf(parentNote: NoteIndexRecord, newChildrenIdsArray: Note['Record']['_id'][]): void {
    parentNote.childNotesIds.next(newChildrenIdsArray);
  }
}
