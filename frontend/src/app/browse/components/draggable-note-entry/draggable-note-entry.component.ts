import { Component, Input, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
import { Note } from 'types';
import { DropCheckerService } from '@/browse/services/drop-checker';
import { ExpandableDirectiveStateKeeperService } from '@/common/services/expandable-directive-state-keeper.service';
import { DragAndDropModeService, DragModesEnum } from '@/browse/services/drag-and-drop-mode';
import { InterfaceEventsService, Events } from '@/services/interface-events';

@Component({
  selector: 'app-draggable-note-entry',
  templateUrl: './draggable-note-entry.component.html',
  styleUrls: ['./draggable-note-entry.component.less'],
})
export class DraggableNoteEntryComponent {
  @Input() note: Note['Record'];
  @Input() browserReference: HTMLElement;

  public noteTitle: Note['Record']['title'];

  private shouldEnableRouter = true;
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

  private mouseUpHandlerBinded = this.mouseUpHandler.bind(this);
  private firstMouseMoveHandlerBinded = this.firstMouseMoveHandler.bind(this);
  private positionNoteShadowBinded = this.positionNoteShadow.bind(this);
  private mouseOverHandlerBinded = this.mouseOverHandler.bind(this);
  private mouseOutHandlerBinded = this.mouseOutHandler.bind(this);

  constructor(
    private router: Router,
    private el: ElementRef<HTMLSpanElement>,
    private dropCheckerService: DropCheckerService,
    private expandableDirectiveStateKeeperService: ExpandableDirectiveStateKeeperService,
    private interfaceEventsService: InterfaceEventsService,
    private dragAndDropModeService: DragAndDropModeService
  ) { }

  @HostListener('click')
  public openNote(): void {
    if (this.shouldEnableRouter) {
      this.router.navigate(['note', this.note._id]);
    } else {
      this.shouldEnableRouter = true;
    }
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
    if ((event.target as HTMLElement).classList.contains('expansion-arrow') && (event.target as HTMLElement).style.opacity === "1") {
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
    if ((event.target as HTMLElement).classList.contains('drop-zone') && (event.target as HTMLElement).getAttribute('noteId') !== this.note._id) {
      this.dropCheckerService.canDropHere(event.target as HTMLElement, this.note)
        .subscribe((canBeDropped) => {
          if (canBeDropped) {
            (event.target as HTMLElement).classList.add('indicate-drop-zone');
          } else {
            this.setCantDropDragClass();
          }
        });
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

  private mouseOutHandler(event: MouseEvent) {
    this.setCurrentDragModeClass();
    if (this.hoverExpansion.ref) {
      clearTimeout(this.hoverExpansion.ref);
      delete this.hoverExpansion.ref;
    }
    delete this.hoverExpansion.itemId;
    (event.target as HTMLElement).classList.remove('indicate-drop-zone');
  }
  
  private mouseUpHandler(event: MouseEvent) {
    if (this.dragStarted) {
      (this.el as any).nativeElement.style.opacity = this.originalOpacity;
      this.noteClone.remove();
      this.dragStarted = false;
      this.mouseOutHandler(event);

      this.dropCheckerService.canDropHere(event.target as HTMLElement, this.note)
        .subscribe((canBeDropped) => {
          if (canBeDropped) {
            this.shouldEnableRouter = false;
            const noteDropEvent = new CustomEvent<Note['Record']>('notedrop', {
              bubbles: false,
              detail: this.note,
            });
            event.target.dispatchEvent(noteDropEvent);
          }
        });
    }
    this.readyToDrag = false;

    document.removeEventListener('mousemove', this.positionNoteShadowBinded);
    document.removeEventListener('mousemove', this.firstMouseMoveHandlerBinded);
    document.removeEventListener('mouseover', this.mouseOverHandlerBinded);
    document.removeEventListener('mouseout', this.mouseOutHandlerBinded);
    document.removeEventListener('mouseup', this.mouseUpHandlerBinded);

    document.body.classList.remove('drag-ongoing');
    this.browserReference.classList.remove('drag-ongoing');

    this.dragModeSubscription?.unsubscribe();
    this.clearBorwserElementClasses();

    this.interfaceEventsService.subscribeForEvent(this.dragAndDropModeService.getRegisteredModifiersKeys(), Events.keyup, () => {
      () => this.interfaceEventsService.preventDefaultFor(this.dragAndDropModeService.getRegisteredModifiersKeys(), false);
    }, { afterStateCallback: true });
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
      this.shouldEnableRouter = false;

      this.browserReference.classList.add('drag-ongoing');
      document.body.classList.add('drag-ongoing');

      this.interfaceEventsService.preventDefaultFor(this.dragAndDropModeService.getRegisteredModifiersKeys());
      
      this.dragModeSubscription = this.dragAndDropModeService
        .subscribe(() => {
            this.clearBorwserElementClasses();
            this.setCurrentDragModeClass();
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
