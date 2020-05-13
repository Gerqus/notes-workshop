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
    const targetNote = this.notesControllerService.getFromIndex(elementToCheck.getAttribute('noteId'))

    if (
    !targetNote ||
    !targetNote._id ||
    !elementToCheck.classList.contains('drop-zone')
    ) {
      return false;
    } else
    if (this.dragAndDropModeService.getCurrentDragMode() === DragModesEnum.move) {
      return this.canMoveHere(targetNote, draggedNote);
    } else
    if (this.dragAndDropModeService.getCurrentDragMode() === DragModesEnum.link) {
      return this.canLinkHere(draggedNote);
    } else
    if (this.dragAndDropModeService.getCurrentDragMode() === DragModesEnum.copy) {
      return this.canCopyHere(targetNote);
    } else
    if (this.dragAndDropModeService.getCurrentDragMode() === DragModesEnum.reorder) {
      return this.canReorderHere(targetNote);
    } else {
      return false;
    }
  }

  private canReorderHere(targetNote: NoteIndexRecord): boolean {
    if (targetNote._id === this.notesControllerService.topNotesParentKey) {
      return false;
    } else {
      return true;
    }
  }

  private canLinkHere(draggedNote: NoteIndexRecord): boolean {
    return !draggedNote.isLink;
  }

  private canCopyHere(targetNote: NoteIndexRecord): boolean {
    return !targetNote.isLink;
  }

  private canMoveHere(targetNote: NoteIndexRecord, draggedNote: NoteIndexRecord): boolean {
    if (
    targetNote._id === draggedNote._id ||
    targetNote._id === draggedNote.parentNoteId ||
    targetNote.isLink
    ) {
      return false;
    } else if (
    targetNote._id === this.notesControllerService.topNotesParentKey
    ) {
      return true;
    } else {
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
