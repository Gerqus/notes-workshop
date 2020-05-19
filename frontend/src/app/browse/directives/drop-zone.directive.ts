import { Directive, ElementRef, OnInit, HostListener, Input } from '@angular/core';
import { Note } from 'types';
import { ApiService } from '@/services/api-service';
import { ExpandableDirectiveStateKeeperService } from '@/common/services/expandable-directive-state-keeper.service';
import { DragAndDropModeService } from '../services/drag-and-drop-mode';
import { NoteIndexRecord } from '@/services/notes-controller/note-index-record.class';
import { NotesControllerService } from '@/services/notes-controller';
import { DragModesEnum } from '../enums/dragModes.enum';

@Directive({
  selector: '[appDropZone]'
})
export class DropZoneDirective implements OnInit {
  @Input('appDropZone') targetNoteId: Note['Record']['_id'];

  constructor(
    private el: ElementRef<HTMLElement>,
    private notesControllerService: NotesControllerService,
    private expandableDirectiveStateKeeperService: ExpandableDirectiveStateKeeperService,
    private dragAndDropModeService: DragAndDropModeService,
  ) { }

  ngOnInit(): void {
    this.el.nativeElement.classList.add('drop-zone');
    this.el.nativeElement.setAttribute('noteId', this.targetNoteId);
  }

  @HostListener('notedrop', ['$event'])
  public handleNoteDrop(e: CustomEvent<NoteIndexRecord>) {
    const currentDragMode = this.dragAndDropModeService.getCurrentDragMode();
    let shouldExpandTarget = true;
    switch (currentDragMode) {
      case DragModesEnum.move: 
        this.notesControllerService.moveNote(e.detail.actualNote, this.targetNoteId).subscribe();
        break;
      case DragModesEnum.copy:
      // case DragModesEnum.copyShallow: 
        this.notesControllerService.copyNoteShallow(e.detail.actualNote, this.targetNoteId).subscribe();
        break;
      // case DragModesEnum.copyDeep: 
      //   this.apiService.note.copyNoteDeep(e.detail, this.parentNoteId);
      //   break;
      case DragModesEnum.link: 
        this.notesControllerService.linkNote(e.detail.actualNote, this.targetNoteId).subscribe();
        break;
      case DragModesEnum.reorder: 
        this.notesControllerService.reorderNote(e.detail.actualNote, this.targetNoteId).subscribe();
        shouldExpandTarget = false;
        break;
      default:
        // void
        break;
    }
    if (shouldExpandTarget) {
      this.expandableDirectiveStateKeeperService.setState(this.targetNoteId + '_browser', true); // will set value also for 'top' noteId, but it shouldn't be an issue (it's never read)
    }
  }
}
