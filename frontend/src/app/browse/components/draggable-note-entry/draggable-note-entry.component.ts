import { Component, Input, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { Note } from 'types';
import { ExpandableDirectiveStateKeeperService } from '@/common/services/expandable-directive-state-keeper.service';
import { NotesControllerService } from '@/services/notes-controller';
import { NoteIndexRecord } from '@/services/notes-controller/note-index-record.class';

@Component({
  selector: 'app-draggable-note-entry',
  templateUrl: './draggable-note-entry.component.html',
  styleUrls: ['./draggable-note-entry.component.less'],
})
export class DraggableNoteEntryComponent implements OnChanges {
  @Input() noteId: Note['Record']['_id'];
  @Input() browserReference: HTMLElement;

  public note: NoteIndexRecord;
  public sourceNote: NoteIndexRecord = null;

  public noteTitle: Note['Record']['title'];

  private hoverExpansion: {
    readonly timeout: number,
    ref?: number,
    itemId?: Note['Record']['_id']
  } = {
    timeout: 500,
  };
  private dragOngoing = false;

  constructor(
    private notesControllerService: NotesControllerService,
    private expandableDirectiveStateKeeperService: ExpandableDirectiveStateKeeperService,
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.noteId.currentValue !== changes.noteId.previousValue) {
      this.note = this.notesControllerService.getFromIndex(this.noteId);
      if(this.note.isLink) {
        this.sourceNote = this.notesControllerService.getFromIndex(this.note.sourceNoteId);
      }
    }
  }

  @HostListener('appDragOver', ['$event'])
  public mouseOverHandler(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('expansion-button') && !(event.target as HTMLElement).classList.contains('hidden')) {
      const getExpandableItemIdEvent = new CustomEvent('getItemId', {
        bubbles: false,
        detail: {
          cb: (itemId: Note['Record']['_id']) => {
            this.hoverExpansion.ref = setTimeout(() => {
              this.hoverExpansion.itemId = itemId;
              this.expandableDirectiveStateKeeperService.setState(itemId, true);
              delete this.hoverExpansion.ref;
            }, this.hoverExpansion.timeout) as any;
          }
        }
      });
      event.target.dispatchEvent(getExpandableItemIdEvent);
    }
    else if ((event.target as HTMLElement).classList.contains('drop-zone')) {
      const dragOverEvent = new CustomEvent<NoteIndexRecord>('appDragOverDropzone', {
        bubbles: false,
        detail: this.note,
      });
      event.target.dispatchEvent(dragOverEvent);
    }
  }

  @HostListener('appDragOut', ['$event'])
  public mouseOutHandler(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('drop-zone')) {
      const dragOutEvent = new CustomEvent<NoteIndexRecord>('appDragOutDropzone', {
        bubbles: false,
        detail: this.note,
      });
      event.target.dispatchEvent(dragOutEvent);
    }
    if (this.hoverExpansion.ref) {
      clearTimeout(this.hoverExpansion.ref);
      delete this.hoverExpansion.ref;
    }
    delete this.hoverExpansion.itemId;
  }

  @HostListener('appDragDrop', ['$event'])
  public dragDropHandler() {
    this.dragOngoing = false;
    this.browserReference.classList.remove('drag-ongoing');

    const noteDropEvent = new CustomEvent<NoteIndexRecord>('notedrop', {
      bubbles: false,
      detail: this.note,
    });
    event.target.dispatchEvent(noteDropEvent);
  }

  @HostListener('appDragStart', ['$event'])
  public dragStartHandler() {
    this.dragOngoing = true;
    this.browserReference.classList.add('drag-ongoing');
  }
  
  @HostListener('mouseup', ['$event'])
  public mouseUpHandler(event: MouseEvent) {
    if (!this.dragOngoing) {
      this.notesControllerService.openNote(this.note);
    }
  }
}
