import { Directive, ElementRef, OnChanges, HostListener, Input } from '@angular/core';
import { Note } from 'types';
import { ExpandableDirectiveStateKeeperService } from '@/common/services/expandable-directive-state-keeper.service';
import { DragAndDropModeService } from '../services/drag-and-drop-mode';
import { NoteIndexRecord } from '@/services/notes-controller/note-index-record.class';
import { NotesControllerService } from '@/services/notes-controller';
import { DragModesEnum } from '../enums/dragModes.enum';
import { Observable, of } from 'rxjs';
import { flatMap } from 'rxjs/operators';

@Directive({
  selector: '[appDropZone]'
})
export class DropZoneDirective implements OnChanges {
  @Input('targetNoteId') targetNoteId: Note['Record']['_id'];
  @Input('targetOrderIndex') targetOrderIndex: Note['Record']['index'];

  constructor(
    private el: ElementRef<HTMLElement>,
    private notesControllerService: NotesControllerService,
    private expandableDirectiveStateKeeperService: ExpandableDirectiveStateKeeperService,
    private dragAndDropModeService: DragAndDropModeService,
  ) { }

  ngOnChanges(): void {
    this.el.nativeElement.classList.add('drop-zone');
    this.targetNoteId !== undefined && this.el.nativeElement.setAttribute('noteId', this.targetNoteId);
    this.targetOrderIndex !== undefined && this.el.nativeElement.setAttribute('orderIndex', this.targetOrderIndex.toString());
  }

  @HostListener('notedrop', ['$event'])
  public handleNoteDrop(e: CustomEvent<NoteIndexRecord>) {
    const currentDragMode = this.dragAndDropModeService.getCurrentDragMode();
    let shouldExpandTarget = true;
    switch (currentDragMode) {
      case DragModesEnum.move:
        this.noteMoveHandler(e.detail.actualNote).subscribe();
        break;
      case DragModesEnum.copy:
      // case DragModesEnum.copyShallow: 
        this.notesControllerService.copyNoteShallow(e.detail.actualNote, this.targetNoteId).subscribe();
        break;
      // case DragModesEnum.copyDeep: 
      //   this.apiService.note.copyNoteDeep(e.detail.actualNote, this.targetNoteId).subscribe();
      //   break;
      case DragModesEnum.link: 
        this.notesControllerService.linkNote(e.detail.actualNote, this.targetNoteId).subscribe();
        break;
      default:
        // void
        break;
    }
    if (shouldExpandTarget) {
      this.expandableDirectiveStateKeeperService.setState(this.targetNoteId + '_browser', true); // will set value also for 'top' noteId, but it shouldn't be an issue (it's never read)
    }
  }

  private noteMoveHandler(noteToMove: Note['Record']): Observable<Note['Record']> {
    let resolver: Observable<Note['Record']> = of(null);
    if (noteToMove.parentNoteId !== this.targetNoteId) {
      resolver = resolver.pipe(flatMap(() => this.notesControllerService.moveNote(noteToMove, this.targetNoteId, this.targetOrderIndex)));
    }
    else if (this.el.nativeElement.classList.contains('drop-between')) {
      resolver = resolver.pipe(flatMap(() => this.notesControllerService.reorderNoteInParent(noteToMove, this.targetOrderIndex)));
    }
    return resolver;
  }
}
