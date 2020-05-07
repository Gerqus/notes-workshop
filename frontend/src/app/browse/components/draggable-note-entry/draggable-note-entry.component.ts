import { Component, Input, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { Note } from 'types';
import { ApiService } from '@/services/api-service';
import { ExpandableDirectiveStateKeeperService } from '@/common/services/expandable-directive-state-keeper.service';
import { InterfaceEventsService, Keys, Events } from '@/services/interface-events';

enum DragModeEnum {
  'copy',
  'link',
  'reorder',
  'move',
  'cantDrop',
  'previous',
}

@Component({
  selector: 'app-draggable-note-entry',
  templateUrl: './draggable-note-entry.component.html',
  styleUrls: ['./draggable-note-entry.component.less'],
})
export class DraggableNoteEntryComponent {
  @Input() note: Note['Record'];
  @Input() browserReference: HTMLElement;

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
  private dragMode = new BehaviorSubject(DragModeEnum.move);
  private dragModeClasses = {
    [DragModeEnum.copy]: 'drag-mode-copy',
    [DragModeEnum.link]: 'drag-mode-link',
    [DragModeEnum.reorder]: 'drag-mode-reorder',
    [DragModeEnum.move]: 'drag-mode-move',
    [DragModeEnum.cantDrop]: 'drag-mode-cant-drop',
  }
  private dragModifiersModes = {
    [Keys.f1]: DragModeEnum.copy,
    [Keys.f2]: DragModeEnum.link,
    [Keys.f3]: DragModeEnum.reorder,
  }
  private registeredModifiersKeys: Keys[]; // will be populated with keys of #dragModifiersModes in constructor
  private dragModeSubscription: Subscription;
  private previousDragMode: DragModeEnum;

  private mouseUpHandlerBinded = this.mouseUpHandler.bind(this);
  private firstMouseMoveHandlerBinded = this.firstMouseMoveHandler.bind(this);
  private positionNoteShadowBinded = this.positionNoteShadow.bind(this);
  private mouseOverHandlerBinded = this.mouseOverHandler.bind(this);
  private mouseOutHandlerBinded = this.mouseOutHandler.bind(this);

  constructor(
    private router: Router,
    private el: ElementRef<HTMLSpanElement>,
    private apiService: ApiService,
    private expandableDirectiveStateKeeperService: ExpandableDirectiveStateKeeperService,
    private interfaceEventsService: InterfaceEventsService,
  ) {
    this.registeredModifiersKeys = Object.keys(this.dragModifiersModes) as Keys[];
    this.registeredModifiersKeys.forEach(key => {
      this.interfaceEventsService.getStateSubject(key)
        .subscribe(this.handleDragMode.bind(this));
    });
  }

  private handleDragMode() {
    let keysCount = 0;
    let matchedKey = '';
    this.registeredModifiersKeys.forEach(key => {
      if (this.interfaceEventsService.getStateSubject(key).getValue()) {
        ++keysCount;
        matchedKey = key;
      }
    });
    if (keysCount === 1) {
      this.dragMode.next(this.dragModifiersModes[matchedKey]);
    } else {
      this.dragMode.next(DragModeEnum.move);
    }
  }

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

  public handleNoteDrop(e: CustomEvent<Note['Record']>) {
    this.apiService.note.moveNote(e.detail, this.note._id);
  }

  private canDropHere(elementToCheck: HTMLElement): Observable<boolean> {
    const targetNoteId = elementToCheck.getAttribute('noteId');

    return new Observable(subscriber => {
      if (
      !targetNoteId ||
      !elementToCheck.classList.contains('drop-zone')
      ) {
        subscriber.next(false);
        subscriber.complete();
      } else
      if (this.dragMode.getValue() === DragModeEnum.move) {
        this.canMoveHere(targetNoteId)
          .subscribe(canMove => {
            subscriber.next(canMove);
            subscriber.complete();
          });
      } else
      if (this.dragMode.getValue() === DragModeEnum.link) {
        this.canLinkHere(targetNoteId)
          .subscribe(canLink => {
            subscriber.next(canLink);
            subscriber.complete();
          });
      } else
      if (this.dragMode.getValue() === DragModeEnum.copy) {
        this.canCopyHere(targetNoteId)
          .subscribe(canCopy => {
            subscriber.next(canCopy);
            subscriber.complete();
          });
      } else
      if (this.dragMode.getValue() === DragModeEnum.reorder) {
        this.canReorderHere(targetNoteId)
          .subscribe(canReorder => {
            subscriber.next(canReorder);
            subscriber.complete();
          });
      } else {
        subscriber.next(false);
        subscriber.complete();
      }
    });
  }

  private canReorderHere(targetNoteId: Note['Record']['_id']): Observable<boolean> {
    return new Observable(subscriber => {
      subscriber.next(true);
      subscriber.complete();
    });
  }

  private canLinkHere(targetNoteId: Note['Record']['_id']): Observable<boolean> {
    return new Observable(subscriber => {
      subscriber.next(true);
      subscriber.complete();
    });
  }

  private canCopyHere(targetNoteId: Note['Record']['_id']): Observable<boolean> {
    return new Observable(subscriber => {
      subscriber.next(true);
      subscriber.complete();
    });
  }

  private canMoveHere(targetNoteId: Note['Record']['_id']): Observable<boolean> {
    return new Observable(subscriber => {
      if (
      targetNoteId === this.note._id ||
      targetNoteId === this.note.parentNoteId
      ) {
        subscriber.next(false);
        subscriber.complete();
      } else if (
      targetNoteId === this.apiService.note.topNotesParentKey
      ) {
        subscriber.next(true);
        subscriber.complete();
      } else {
        this.apiService.note.getNoteById(targetNoteId)
          .subscribe((targetNote) => {
            this.isNoteInTreeOfId(targetNote, this.note._id)
              .subscribe((isInTree) => {
                subscriber.next(!isInTree);
                subscriber.complete();
              });
          });
      }
    });
  }

  private isNoteInTreeOfId(noteToCheck: Note['Record'], potentialParentId: Note['Record']['_id']): Observable<boolean> {
    return new Observable((subscriber) => {
      if (noteToCheck.parentNoteId === potentialParentId) {
        subscriber.next(true);
        subscriber.complete();
      } else
      if (noteToCheck.parentNoteId === this.apiService.note.topNotesParentKey || !potentialParentId) {
        subscriber.next(false);
        subscriber.complete();
      } else {
        const noteSub = this.apiService.note.getNoteById(noteToCheck.parentNoteId)
          .subscribe(fetchedNote => {
            const recursiveSub = this.isNoteInTreeOfId(fetchedNote, potentialParentId)
              .subscribe((isInTree) => {
                subscriber.next(isInTree);
                subscriber.complete();
                setTimeout(() => recursiveSub.unsubscribe());
              })
              setTimeout(() => noteSub.unsubscribe());
          });
      }
    })
  }

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
      this.canDropHere(event.target as HTMLElement)
        .subscribe((canBeDropped) => {
          if (canBeDropped) {
            (event.target as HTMLElement).classList.add('indicate-drop-zone');
          } else {
            this.setDragModeClassFor(DragModeEnum.cantDrop);
          }
        });
    }
  }
  
  private clearBorwserElementClasses(): void {
    Object.values(this.dragModeClasses).forEach(modeclass => {
      this.browserReference.classList.remove(modeclass);
    });
  }

  private setDragModeClassFor(dragModeToSetClassFor: DragModeEnum) {
    if (dragModeToSetClassFor === DragModeEnum.previous) {
      dragModeToSetClassFor = this.previousDragMode; 
    } else {
      this.previousDragMode = this.dragMode.getValue();
    }
    this.clearBorwserElementClasses();
    this.browserReference.classList.add(this.dragModeClasses[dragModeToSetClassFor]);
  }

  private mouseOutHandler(event: MouseEvent) {
    this.setDragModeClassFor(DragModeEnum.previous);
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

      this.canDropHere(event.target as HTMLElement)
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

    this.interfaceEventsService.subscribeForEvent(this.registeredModifiersKeys, Events.keyup, () => {
      () => this.interfaceEventsService.preventDefaultFor(this.registeredModifiersKeys, false);
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

      this.interfaceEventsService.preventDefaultFor(this.registeredModifiersKeys);
      
      this.dragModeSubscription = this.dragMode
        .subscribe((currentDragMode) => {
            this.clearBorwserElementClasses();
            this.setDragModeClassFor(currentDragMode);
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
