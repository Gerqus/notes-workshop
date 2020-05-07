import { Directive, ElementRef, OnInit, HostListener, Input } from '@angular/core';
import { Note } from 'types';
import { ApiService } from '@/services/api-service';
import { ExpandableDirectiveStateKeeperService } from '@/common/services/expandable-directive-state-keeper.service';
import { DragAndDropModeService, DragModesEnum } from '../services/drag-and-drop-mode';

@Directive({
  selector: '[appDropZone]'
})
export class DropZoneDirective implements OnInit {
  @Input('appDropZone') parentNoteId: Note['Record']['_id'];

  constructor(
    private el: ElementRef<HTMLElement>,
    private apiService: ApiService,
    private expandableDirectiveStateKeeperService: ExpandableDirectiveStateKeeperService,
    private dragAndDropModeService: DragAndDropModeService,
  ) { }

  ngOnInit(): void {
    this.el.nativeElement.classList.add('drop-zone');
    this.el.nativeElement.setAttribute('noteId', this.parentNoteId);
  }

  @HostListener('notedrop', ['$event'])
  public handleNoteDrop(e: CustomEvent<Note['Record']>) {
    const currentDragMode = this.dragAndDropModeService.getCurrentDragMode();
    switch (currentDragMode) {
      case DragModesEnum.move: 
        this.apiService.note.moveNote(e.detail, this.parentNoteId);
        break;
      case DragModesEnum.copy: 
      // case DragModesEnum.copyShallow: 
        this.apiService.note.copyNoteShallow(e.detail, this.parentNoteId);
        break;
      // case DragModesEnum.copyDeep: 
      //   this.apiService.note.copyNoteDeep(e.detail, this.parentNoteId);
      //   break;
      case DragModesEnum.link: 
        // this.apiService.note.linkNote(e.detail, this.parentNoteId);
        break;
      case DragModesEnum.reorder: 
        // this.apiService.note.reorderNote(e.detail, this.parentNoteId);
        break;
      default:
        // void
        break;
    }
    this.expandableDirectiveStateKeeperService.setState(this.parentNoteId, true); // will set value also for 'top' noteId, but it shouldn't be an issue (it's never read)
  }
}
