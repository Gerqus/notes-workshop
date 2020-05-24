import { Injectable } from '@angular/core';
import { DragAndDropModeService } from '../drag-and-drop-mode';
import { NotesControllerService } from '@/services/notes-controller';
import { NoteIndexRecord } from '@/services/notes-controller/note-index-record.class';
import { DragModesEnum } from '../../enums/dragModes.enum';

@Injectable({
  providedIn: 'root'
})
export class DropCheckerService {

  constructor(
    private dragAndDropModeService: DragAndDropModeService,
    private notesControllerService: NotesControllerService,
  ) { }
  
  public canDropHere(dropTargetElement: HTMLElement, draggedNote: NoteIndexRecord): boolean {
    if (
    !dropTargetElement.getAttribute('noteId') ||
    !dropTargetElement.classList.contains('drop-zone')
    ) {
      return false;
    } else
    if (this.dragAndDropModeService.getCurrentDragMode() === DragModesEnum.move) {
      return this.canMoveHere(draggedNote, dropTargetElement);
    } else
    if (this.dragAndDropModeService.getCurrentDragMode() === DragModesEnum.link) {
      return this.canLinkHere(draggedNote);
    } else
    if (this.dragAndDropModeService.getCurrentDragMode() === DragModesEnum.copy) {
      return this.canCopyHere(dropTargetElement);
    } else {
      return false;
    }
  }

  private canLinkHere(draggedNote: NoteIndexRecord): boolean {
    return !draggedNote.isLink;
  }

  private canCopyHere(dropTargetElement: HTMLElement): boolean {
    const targetNote = this.notesControllerService.getFromIndex(dropTargetElement.getAttribute('noteId'));
    return !targetNote.isLink;
  }

  private canMoveHere(draggedNote: NoteIndexRecord, dropTargetElement: HTMLElement): boolean {
    const targetNote = this.notesControllerService.getFromIndex(dropTargetElement.getAttribute('noteId'));
    if (dropTargetElement.classList.contains('drop-between')) {
      const orderIndex = parseInt(dropTargetElement.getAttribute('orderIndex'));
      if (draggedNote.parentNoteId === targetNote._id) {
        return orderIndex !== draggedNote.index && orderIndex - 1 !== draggedNote.index
      } else {
        return !this.isNoteInTreeOf(targetNote, draggedNote);
      }
    } else {
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
  }

  private isNoteInTreeOf(noteToCheck: NoteIndexRecord, potentialParent: NoteIndexRecord): boolean {
    if (
      noteToCheck._id === potentialParent._id ||
      noteToCheck.parentNoteId === potentialParent._id
    ) {
      return true;
    } else if (
      noteToCheck.parentNoteId === this.notesControllerService.topNotesParentKey ||
      noteToCheck._id === this.notesControllerService.topNotesParentKey ||
      !potentialParent._id
    ) {
      return false;
    } else {
      const fetchedNote = this.notesControllerService.getFromIndex(noteToCheck.parentNoteId)
      return this.isNoteInTreeOf(fetchedNote, potentialParent);
    }
  }
}
