import { Directive, ElementRef, OnChanges, HostListener, Input } from '@angular/core';
import { Note } from 'types';
import { DropCheckerService } from '@/browse/services/drop-checker';
import { ExpandableDirectiveStateKeeperService } from '@/common/services/expandable-directive-state-keeper.service';
import { DragAndDropModeService } from '../services/drag-and-drop-mode';
import { NoteIndexRecord } from '@/services/notes-controller/note-index-record.class';
import { NotesControllerService } from '@/services/notes-controller';
import { DragModesEnum } from '../enums/dragModes.enum';
import { Observable, of, Subscription } from 'rxjs';
import { flatMap } from 'rxjs/operators';

@Directive({
  selector: '[appDropZone]'
})
export class DropZoneDirective implements OnChanges {
  @Input() targetNoteId: Note['Record']['_id'];
  @Input() targetOrderIndex: Note['Record']['index'];
  @Input() dropIndicator: HTMLElement;

  private readonly dragModeClasses = {
    [DragModesEnum.copy]: 'drag-mode-copy', // is set on key modifier press
    [DragModesEnum.link]: 'drag-mode-link', // is set on key modifier press
    [DragModesEnum.move]: 'drag-mode-move', // is set when default mode should be used
    [DragModesEnum.cantDrop]: 'drag-mode-cant-drop', // is set when action is not permitted
  }
  private dragModeSubscription: Subscription;

  constructor(
    private el: ElementRef<HTMLElement>,
    private notesControllerService: NotesControllerService,
    private expandableDirectiveStateKeeperService: ExpandableDirectiveStateKeeperService,
    private dragAndDropModeService: DragAndDropModeService,
    private dropCheckerService: DropCheckerService,
  ) { }

  ngOnChanges(): void {
    this.dropIndicator = this.dropIndicator || this.el.nativeElement;
    this.el.nativeElement.classList.add('drop-zone');
    this.targetNoteId !== undefined && this.el.nativeElement.setAttribute('noteId', this.targetNoteId);
    this.targetOrderIndex !== undefined && this.el.nativeElement.setAttribute('orderIndex', this.targetOrderIndex.toString());
  }

  @HostListener('notedrop', ['$event'])
  public handleNoteDrop(e: CustomEvent<NoteIndexRecord>): void {
    this.dragCleanup();
    const canBeDropped = this.dropCheckerService.canDropHere(this.el.nativeElement, e.detail);
    if (!canBeDropped) {
      return;
    }

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

  @HostListener('appDragOverDropzone', ['$event'])
  public dragEnterHandler(e: CustomEvent<NoteIndexRecord>): void {
    const draggedNote = e.detail;
    if (draggedNote._id !== this.targetNoteId) {
      this.setCurrentDropzoneClass();
    }
    this.dragModeSubscription = this.dragAndDropModeService
      .subscribe(() => {
        this.removeAllDragModeClasses();
        const canBeDropped = this.dropCheckerService.canDropHere(this.el.nativeElement, draggedNote);
        if (canBeDropped) {
          this.setCurrentDragModeClass();
        } else {
          this.setForbiddenDragModeClass();
        }
      });
  }

  @HostListener('appDragOutDropzone')
  public dragLeaveHandler(): void {
    this.dragCleanup();
  }

  private dragCleanup(): void {
    this.dragModeSubscription?.unsubscribe();
    this.removeCurrentDropzoneClass();
    this.removeAllDragModeClasses();
  }

  private setCurrentDropzoneClass(): void {
    this.dropIndicator.classList.add('highlight-drop-zone');
  }

  private removeCurrentDropzoneClass(): void {
    this.dropIndicator.classList.remove('highlight-drop-zone');
  }

  private setCurrentDragModeClass(): void {
    const currentDragMode = this.dragAndDropModeService.getCurrentDragMode();
    this.dropIndicator.classList.add(this.dragModeClasses[currentDragMode]);
  }
  private setForbiddenDragModeClass(): void {
    this.dropIndicator.classList.add(this.dragModeClasses[DragModesEnum.cantDrop]);
  }

  private removeAllDragModeClasses(): void {
    Object.values(this.dragModeClasses).forEach(modeclass => {
      this.dropIndicator.classList.remove(modeclass);
    });
  }
}
