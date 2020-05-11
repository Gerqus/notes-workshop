import { Injectable } from '@angular/core';
import { DragAndDropModeService, DragModesEnum } from '../drag-and-drop-mode';
import { Note } from 'types';
import { NotesControllerService } from '@/services/notes-controller';
import { NoteIndexRecord } from '@/services/notes-controller/note-index-record.class';

@Injectable({
  providedIn: 'root'
})
export class DropCheckerService {

  constructor(
    private dragAndDropModeService: DragAndDropModeService,
    private notesControllerService: NotesControllerService,
  ) { }
  
  public canDropHere(elementToCheck: HTMLElement, draggedNote: NoteIndexRecord): boolean {
    const targetNoteId = elementToCheck.getAttribute('noteId');

    if (
    !targetNoteId ||
    !elementToCheck.classList.contains('drop-zone')
    ) {
      return false;
    } else
    if (this.dragAndDropModeService.getCurrentDragMode() === DragModesEnum.move) {
      return this.canMoveHere(targetNoteId, draggedNote);
    } else
    if (this.dragAndDropModeService.getCurrentDragMode() === DragModesEnum.link) {
      return this.canLinkHere(draggedNote);
    } else
    if (this.dragAndDropModeService.getCurrentDragMode() === DragModesEnum.copy) {
      return this.canCopyHere();
    } else
    if (this.dragAndDropModeService.getCurrentDragMode() === DragModesEnum.reorder) {
      return this.canReorderHere(targetNoteId);
    } else {
      return false;
    }
  }

  private canReorderHere(targetNoteId: Note['Record']['_id']): boolean {
    if (targetNoteId === this.notesControllerService.topNotesParentKey) {
      return false;
    } else {
      return true;
    }
  }

  private canLinkHere(draggedNote: NoteIndexRecord): boolean {
    return !draggedNote.isLink;
  }

  private canCopyHere(): boolean {
    return true;
  }

  private canMoveHere(targetNoteId: Note['Record']['_id'], draggedNote: NoteIndexRecord): boolean {
    if (
    targetNoteId === draggedNote._id ||
    targetNoteId === draggedNote.parentNoteId
    ) {
      return false;
    } else if (
    targetNoteId === this.notesControllerService.topNotesParentKey
    ) {
      return true;
    } else {
      const targetNote = this.notesControllerService.getFromIndex(targetNoteId);
      return !this.isNoteInTreeOf(targetNote, draggedNote);
    }
  }

  private isNoteInTreeOf(noteToCheck: NoteIndexRecord, potentialParent: NoteIndexRecord): boolean {
    if (noteToCheck.parentNoteId === potentialParent._id) {
      return true;
    } else
    if (
    noteToCheck.parentNoteId === this.notesControllerService.topNotesParentKey ||
    !potentialParent._id
    ) {
      return false;
    } else {
      const fetchedNote = this.notesControllerService.getFromIndex(noteToCheck.parentNoteId)
      return this.isNoteInTreeOf(fetchedNote, potentialParent);
    }
  }
}
