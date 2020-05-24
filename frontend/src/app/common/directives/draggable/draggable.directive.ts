import { Directive, HostListener, ElementRef, Input, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[appDraggable]'
})
export class DraggableDirective {
  private readonly fadedOpacity = '0.4';
  private readonly dragThreshold = {x: 2, y: 2};

  @Output() appDragOver = new EventEmitter<MouseEvent>();
  @Output() appDragOut = new EventEmitter<MouseEvent>();
  @Output() appDragDrop = new EventEmitter<MouseEvent>();
  @Output() appDragStart = new EventEmitter<MouseEvent>();

  private originalOpacity = '1';
  private clickCoordinates = {x: 0, y: 0};
  private readyToDrag = false;
  private appDragStarted = false;

  private draggableElementClone: HTMLElement;

  private mouseUpHandlerBinded = this.mouseUpHandler.bind(this);
  private appDragOverHandlerBinded = this.appDragOverHandler.bind(this);
  private appDragOutHandlerBinded = this.appDragOutHandler.bind(this);
  private firstMouseMoveHandlerBinded = this.firstMouseMoveHandler.bind(this);
  private positionElementCloneBinded = this.positionElementClone.bind(this);

  constructor(
    private el: ElementRef<HTMLSpanElement>
  ) { }

  @HostListener('mousedown', ['$event'])
  public mousedownListener(event: MouseEvent) {
    this.clickCoordinates.x = event.clientX;
    this.clickCoordinates.y = event.clientY;
    this.readyToDrag = true;
    document.addEventListener('mousemove', this.firstMouseMoveHandlerBinded);
    document.addEventListener('mouseup', this.mouseUpHandlerBinded);
  };

  @HostListener('dragstart')
  public dragstartListener(e: MouseEvent) { e.preventDefault(); return false };

  @HostListener('select')
  public selectListener(e: MouseEvent) { e.preventDefault(); return false };

  private firstMouseMoveHandler(event: MouseEvent) {
    if (
      this.readyToDrag &&
      (Math.abs(this.clickCoordinates.x - event.clientX) > this.dragThreshold.x ||
      Math.abs(this.clickCoordinates.y - event.clientY) > this.dragThreshold.y)
    ) {
      document.addEventListener('mouseover', this.appDragOverHandlerBinded);
      document.addEventListener('mouseout', this.appDragOutHandlerBinded);

      document.removeEventListener('mousemove', this.firstMouseMoveHandlerBinded);
      document.addEventListener('mousemove', this.positionElementCloneBinded);

      this.appDragStarted = true;

      this.originalOpacity = this.el.nativeElement.style.opacity ? (this.el as any).nativeElement.style.opacity : this.originalOpacity;
      this.el.nativeElement.style.opacity = this.fadedOpacity;
      const draggedElementSize = this.el.nativeElement.getBoundingClientRect();

      this.draggableElementClone = (this.el as any).nativeElement.cloneNode(true) as HTMLElement;
      this.draggableElementClone.style.opacity = this.fadedOpacity;
      this.draggableElementClone.style.position = 'absolute';
      this.draggableElementClone.style.pointerEvents = 'none';
      this.draggableElementClone.style.zIndex = '99';
      this.draggableElementClone.style.width = draggedElementSize.width + 'px';
      this.draggableElementClone.style.height = draggedElementSize.height + 'px';
      this.draggableElementClone.style.marginLeft = -1 * draggedElementSize.width / 2 + 'px';
      this.draggableElementClone.style.marginTop = -1 * draggedElementSize.height / 2 + 'px';

      this.positionElementClone(event);

      document.body.append(this.draggableElementClone);

      this.appDragStart.emit(event);
    }
  }

  private positionElementClone(event: MouseEvent) {
    this.draggableElementClone.style.left = event.pageX + 'px';
    this.draggableElementClone.style.top = event.pageY + 'px';
  }
  
  private mouseUpHandler(event: MouseEvent) {
    this.readyToDrag = false;
  
    if (this.appDragStarted) {
      (this.el as any).nativeElement.style.opacity = this.originalOpacity;
      this.draggableElementClone.remove();
      this.appDragStarted = false;

      this.appDragDrop.emit(event);
    }

    document.removeEventListener('mousemove', this.positionElementCloneBinded);
    document.removeEventListener('mousemove', this.firstMouseMoveHandlerBinded);
    document.removeEventListener('mouseup', this.mouseUpHandlerBinded);
    document.removeEventListener('mouseover', this.appDragOverHandlerBinded);
    document.removeEventListener('mouseout', this.appDragOutHandlerBinded);

    event.preventDefault();
    return false;
  }

  private appDragOverHandler(e: MouseEvent): void {
    this.appDragOver.emit(e);
  }

  private appDragOutHandler(e: MouseEvent): void {
    this.appDragOut.emit(e);
  }
}
