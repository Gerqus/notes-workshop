import { Component, Input, ElementRef, HostListener, OnChanges, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { Note } from 'types';
import { DropCheckerService } from '@/browse/services/drop-checker';
import { ExpandableDirectiveStateKeeperService } from '@/common/services/expandable-directive-state-keeper.service';
import { DragAndDropModeService } from '@/browse/services/drag-and-drop-mode';
import { InterfaceEventsService, Events } from '@/services/interface-events';
import { NotesControllerService } from '@/services/notes-controller';
import { NoteIndexRecord } from '@/services/notes-controller/note-index-record.class';
import { DragModesEnum } from '../../enums/dragModes.enum';

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

  private readonly fadedOpacity = '0.4';
  private originalOpacity = '1';
  private readyToDrag = false;
  private dragStarted = false;
  private noteClone: HTMLElement;
  private clickCoordinates = {x: 0, y: 0};
  private hoverExpansion: {
    ref?: number, readonly timeout: number, itemId?: Note['Record']['_id']
  } = {
    timeout: 500,
  };

  private dragModeClasses = {
    [DragModesEnum.copy]: 'drag-mode-copy', // from key modifier
    [DragModesEnum.link]: 'drag-mode-link', // from key modifier
    [DragModesEnum.reorder]: 'drag-mode-reorder', // from key modifier
    [DragModesEnum.move]: 'drag-mode-move', // not from key modifier - default mode
    [DragModesEnum.cantDrop]: 'drag-mode-cant-drop', // not from key modifier, but when action is not permitted
  }
  private dragModeSubscription: Subscription;
  private currentHoverElement: HTMLElement = null;

  private mouseUpHandlerBinded = this.mouseUpHandler.bind(this);
  private firstMouseMoveHandlerBinded = this.firstMouseMoveHandler.bind(this);
  private positionNoteShadowBinded = this.positionNoteShadow.bind(this);
  private mouseOverHandlerBinded = this.mouseOverHandler.bind(this);
  private mouseOutHandlerBinded = this.mouseOutHandler.bind(this);

  constructor(
    private notesControllerService: NotesControllerService,
    private el: ElementRef<HTMLSpanElement>,
    private dropCheckerService: DropCheckerService,
    private expandableDirectiveStateKeeperService: ExpandableDirectiveStateKeeperService,
    private interfaceEventsService: InterfaceEventsService,
    private dragAndDropModeService: DragAndDropModeService,
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.noteId.currentValue !== changes.noteId.previousValue) {
      this.note = this.notesControllerService.getFromIndex(this.noteId);
      if(this.note.isLink) {
        this.sourceNote = this.notesControllerService.getFromIndex(this.note.sourceNoteId);
      }
    }
  }

  public openNote(): void {
    this.notesControllerService.openNote(this.note);
  }

  @HostListener('mousedown', ['$event'])
  public mousedownListener(event: MouseEvent) {
    this.clickCoordinates.x = event.clientX;
    this.clickCoordinates.y = event.clientY;
    this.readyToDrag = true;
    document.addEventListener('mousemove', this.firstMouseMoveHandlerBinded);
    document.addEventListener('mouseup', this.mouseUpHandlerBinded);
  };

  @HostListener('dragstart')
  public dragstartListener() { return false };

  private mouseOverHandler(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('expansion-arrow') && !(event.target as HTMLElement).classList.contains('hidden')) {
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
      this.currentHoverElement = event.target as HTMLElement;
      this.setProperDragModeClass();
    }
  }

  private setProperDragModeClass() {
    if (!this.currentHoverElement || this.currentHoverElement.getAttribute('noteId') === this.note._id) {
      this.setCurrentDragModeClass();
    } else if (this.currentHoverElement) {
      this.currentHoverElement.classList.add('indicate-drop-zone');

      const canBeDropped = this.dropCheckerService.canDropHere(this.currentHoverElement, this.note);
      if (canBeDropped) {
        this.setCurrentDragModeClass();
      } else {
        this.setCantDropDragClass();
      }
    }
  }
  
  private clearBorwserElementClasses(): void {
    Object.values(this.dragModeClasses).forEach(modeclass => {
      this.browserReference.classList.remove(modeclass);
    });
  }

  private setCurrentDragModeClass() {
    const dragModeToSetClassFor = this.dragAndDropModeService.getCurrentDragMode();
    this.clearBorwserElementClasses();
    this.browserReference.classList.add(this.dragModeClasses[dragModeToSetClassFor]);
  }

  private setCantDropDragClass() {
    this.clearBorwserElementClasses();
    this.browserReference.classList.add(this.dragModeClasses[DragModesEnum.cantDrop]);
  }

  private setDragClass(dragClassToSet: DragModesEnum) {
    this.clearBorwserElementClasses();
    this.browserReference.classList.add(this.dragModeClasses[dragClassToSet]);
  }

  private mouseOutHandler(event: MouseEvent) {
    this.currentHoverElement = null;
    this.setCurrentDragModeClass();
    if (this.hoverExpansion.ref) {
      clearTimeout(this.hoverExpansion.ref);
      delete this.hoverExpansion.ref;
    }
    delete this.hoverExpansion.itemId;
    (event.target as HTMLElement).classList.remove('indicate-drop-zone');
  }
  
  private mouseUpHandler(event: MouseEvent) {
    this.readyToDrag = false;
    this.currentHoverElement = null;
  
    if (this.dragStarted) {
      (this.el as any).nativeElement.style.opacity = this.originalOpacity;
      this.noteClone.remove();
      this.dragStarted = false;
      this.mouseOutHandler(event);

      const canBeDropped = this.dropCheckerService.canDropHere(event.target as HTMLElement, this.note)
      if (canBeDropped) {
        const noteDropEvent = new CustomEvent<NoteIndexRecord>('notedrop', {
          bubbles: false,
          detail: this.note,
        });
        event.target.dispatchEvent(noteDropEvent);
      }

        document.body.classList.remove('drag-ongoing');
        this.browserReference.classList.remove('drag-ongoing');
    
        this.dragModeSubscription?.unsubscribe();
        this.clearBorwserElementClasses();

        this.interfaceEventsService.subscribeForEvent(this.dragAndDropModeService.getRegisteredModifiersKeys(), Events.keyup, () => {
          () => this.interfaceEventsService.preventDefaultFor(this.dragAndDropModeService.getRegisteredModifiersKeys(), false);
        }, { afterStateCallback: true });
    } else {
      this.openNote()
    }

    document.removeEventListener('mousemove', this.positionNoteShadowBinded);
    document.removeEventListener('mousemove', this.firstMouseMoveHandlerBinded);
    document.removeEventListener('mouseover', this.mouseOverHandlerBinded);
    document.removeEventListener('mouseout', this.mouseOutHandlerBinded);
    document.removeEventListener('mouseup', this.mouseUpHandlerBinded);

    this.dragAndDropModeService.resetDragMode();

    event.preventDefault();
    return false;
  }

  private firstMouseMoveHandler(event: MouseEvent) {
    if (
      this.readyToDrag &&
      (Math.abs(this.clickCoordinates.x - event.clientX) > 2 ||
      Math.abs(this.clickCoordinates.y - event.clientY) > 2)
    ) {
      document.addEventListener('mouseover', this.mouseOverHandlerBinded);
      document.addEventListener('mouseout', this.mouseOutHandlerBinded);

      document.removeEventListener('mousemove', this.firstMouseMoveHandlerBinded);
      document.addEventListener('mousemove', this.positionNoteShadowBinded);

      this.dragStarted = true;

      this.browserReference.classList.add('drag-ongoing');
      document.body.classList.add('drag-ongoing');

      this.interfaceEventsService.preventDefaultFor(this.dragAndDropModeService.getRegisteredModifiersKeys());
      
      this.dragModeSubscription = this.dragAndDropModeService
        .subscribe(() => {
          this.setProperDragModeClass();
        });

      this.originalOpacity = this.el.nativeElement.style.opacity ? (this.el as any).nativeElement.style.opacity : this.originalOpacity;
      this.el.nativeElement.style.opacity = this.fadedOpacity;
      const noteLabelSize = this.el.nativeElement.getBoundingClientRect();

      this.noteClone = (this.el as any).nativeElement.cloneNode(true) as HTMLElement;
      this.noteClone.style.opacity = this.fadedOpacity;
      this.noteClone.style.position = 'absolute';
      this.noteClone.style.pointerEvents = 'none';
      this.noteClone.style.zIndex = '1000';
      this.noteClone.style.cursor = "move";
      this.noteClone.style.width = noteLabelSize.width + 'px';
      this.noteClone.style.height = noteLabelSize.height + 'px';
      this.positionNoteShadow(event);

      document.body.append(this.noteClone);
      this.noteClone.style.marginLeft = -1 * noteLabelSize.width / 2 + 'px';
      this.noteClone.style.marginTop = -1 * noteLabelSize.height / 2 + 'px';
    }
  }

  private positionNoteShadow(event: MouseEvent) {
    this.noteClone.style.left = event.pageX + 'px';
    this.noteClone.style.top = event.pageY + 'px';
  }

}
