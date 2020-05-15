import { Directive, ElementRef, OnInit, HostListener, Input } from '@angular/core';
import { Note } from 'types';
import { ApiService } from '@/services/api-service';
import { ExpandableDirectiveStateKeeperService } from '@/common/services/expandable-directive-state-keeper.service';
import { DragAndDropModeService, DragModesEnum } from '../services/drag-and-drop-mode';
import { NoteIndexRecord } from '@/services/notes-controller/note-index-record.class';
import { NotesControllerService } from '@/services/notes-controller';

@Directive({
  selector: '[appDropZone]'
})
export class DropZoneDirective implements OnInit {
  @Input('appDropZone') parentNoteId: Note['Record']['_id'];

  constructor(
    private el: ElementRef<HTMLElement>,
    private apiService: ApiService,
    private notesControllerService: NotesControllerService,
    private expandableDirectiveStateKeeperService: ExpandableDirectiveStateKeeperService,
    private dragAndDropModeService: DragAndDropModeService,
  ) { }

  ngOnInit(): void {
    this.el.nativeElement.classList.add('drop-zone');
    this.el.nativeElement.setAttribute('noteId', this.parentNoteId);
  }

  @HostListener('notedrop', ['$event'])
  public handleNoteDrop(e: CustomEvent<NoteIndexRecord>) {
    const currentDragMode = this.dragAndDropModeService.getCurrentDragMode();
    // TODO: use notesControllerService instead of apiService for ntoes manipulations
    switch (currentDragMode) {
      case DragModesEnum.move: 
        this.notesControllerService.moveNote(e.detail.actualNote, this.parentNoteId).subscribe();
        break;
      case DragModesEnum.copy:
      // case DragModesEnum.copyShallow: 
        this.notesControllerService.copyNoteShallow(e.detail.actualNote, this.parentNoteId).subscribe();
        break;
      // case DragModesEnum.copyDeep: 
      //   this.apiService.note.copyNoteDeep(e.detail, this.parentNoteId);
      //   break;
      case DragModesEnum.link: 
        this.apiService.note.linkNote(e.detail.actualNote, this.parentNoteId);
        break;
      case DragModesEnum.reorder: 
        // this.apiService.note.reorderNote(e.detail, this.parentNoteId);
        break;
      default:
        // void
        break;
    }
    this.expandableDirectiveStateKeeperService.setState(this.parentNoteId + '_browser', true); // will set value also for 'top' noteId, but it shouldn't be an issue (it's never read)
  }
}
