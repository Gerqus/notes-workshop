import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DragAndDropModeService, DragModesEnum } from '../drag-and-drop-mode';
import { Note } from 'types';
import { ApiService } from '@/services/api-service';

@Injectable({
  providedIn: 'root'
})
export class DropCheckerService {

  constructor(
    private dragAndDropModeService: DragAndDropModeService,
    private apiService: ApiService,
  ) { }
  
  public canDropHere(elementToCheck: HTMLElement, currentNote: Note['Record']): Observable<boolean> {
    const targetNoteId = elementToCheck.getAttribute('noteId');
    console.log('checking for drag mode', this.dragAndDropModeService.getCurrentDragMode());
    console.log('targetNoteId', targetNoteId);
    console.log("elementToCheck", elementToCheck);

    return new Observable(subscriber => {
      if (
      !targetNoteId ||
      !elementToCheck.classList.contains('drop-zone')
      ) {
        subscriber.next(false);
        subscriber.complete();
      } else
      if (this.dragAndDropModeService.getCurrentDragMode() === DragModesEnum.move) {
        this.canMoveHere(targetNoteId, currentNote)
          .subscribe(canMove => {
            subscriber.next(canMove);
            subscriber.complete();
          });
      } else
      if (this.dragAndDropModeService.getCurrentDragMode() === DragModesEnum.link) {
        this.canLinkHere(targetNoteId, currentNote)
          .subscribe(canLink => {
            subscriber.next(canLink);
            subscriber.complete();
          });
      } else
      if (this.dragAndDropModeService.getCurrentDragMode() === DragModesEnum.copy) {
        this.canCopyHere(targetNoteId, currentNote)
          .subscribe(canCopy => {
            subscriber.next(canCopy);
            subscriber.complete();
          });
      } else
      if (this.dragAndDropModeService.getCurrentDragMode() === DragModesEnum.reorder) {
        this.canReorderHere(targetNoteId, currentNote)
          .subscribe(canReorder => {
            subscriber.next(canReorder);
            subscriber.complete();
          });
      } else {
        subscriber.next(false);
        subscriber.complete();
      }
    });
  }

  private canReorderHere(targetNoteId: Note['Record']['_id'], currentNote: Note['Record']): Observable<boolean> {
    return new Observable(subscriber => {
      if (targetNoteId === this.apiService.note.topNotesParentKey) {
        subscriber.next(false);
        subscriber.complete();
      } else {
        subscriber.next(true);
        subscriber.complete();
      }
    });
  }

  private canLinkHere(targetNoteId: Note['Record']['_id'], currentNote: Note['Record']): Observable<boolean> {
    return new Observable(subscriber => {
      subscriber.next(true);
      subscriber.complete();
    });
  }

  private canCopyHere(targetNoteId: Note['Record']['_id'], currentNote: Note['Record']): Observable<boolean> {
    return new Observable(subscriber => {
      subscriber.next(true);
      subscriber.complete();
    });
  }

  private canMoveHere(targetNoteId: Note['Record']['_id'], currentNote: Note['Record']): Observable<boolean> {
    return new Observable(subscriber => {
      if (
      targetNoteId === currentNote._id ||
      targetNoteId === currentNote.parentNoteId
      ) {
        subscriber.next(false);
        subscriber.complete();
      } else if (
      targetNoteId === this.apiService.note.topNotesParentKey
      ) {
        subscriber.next(true);
        subscriber.complete();
      } else {
        this.apiService.note.getNoteById(targetNoteId)
          .subscribe((targetNote) => {
            this.isNoteInTreeOfId(targetNote, currentNote._id)
              .subscribe((isInTree) => {
                subscriber.next(!isInTree);
                subscriber.complete();
              });
          });
      }
    });
  }

  private isNoteInTreeOfId(noteToCheck: Note['Record'], potentialParentId: Note['Record']['_id']): Observable<boolean> {
    return new Observable((subscriber) => {
      if (noteToCheck.parentNoteId === potentialParentId) {
        subscriber.next(true);
        subscriber.complete();
      } else
      if (noteToCheck.parentNoteId === this.apiService.note.topNotesParentKey || !potentialParentId) {
        subscriber.next(false);
        subscriber.complete();
      } else {
        const noteSub = this.apiService.note.getNoteById(noteToCheck.parentNoteId)
          .subscribe(fetchedNote => {
            const recursiveSub = this.isNoteInTreeOfId(fetchedNote, potentialParentId)
              .subscribe((isInTree) => {
                subscriber.next(isInTree);
                subscriber.complete();
                setTimeout(() => recursiveSub.unsubscribe());
              })
              setTimeout(() => noteSub.unsubscribe());
          });
      }
    })
  }
}
