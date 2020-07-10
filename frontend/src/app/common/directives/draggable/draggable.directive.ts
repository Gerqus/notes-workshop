import { Directive, HostListener, ElementRef, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Directive({
  selector: '[appDraggable]'
})
export class DraggableDirective implements OnInit {
  private readonly fadedOpacity = '0.4';
  private readonly dragThreshold = {x: 2, y: 2};

  @Output() appDragOver = new EventEmitter<MouseEvent>();
  @Output() appDragOut = new EventEmitter<MouseEvent>();
  @Output() appDragDrop = new EventEmitter<MouseEvent>();
  @Output() appDragStart = new EventEmitter<MouseEvent>();

  @Input() dragHandle: HTMLElement = this.el.nativeElement;
  @Input() dragZeroPoint = {top: 0, left: 0};
  @Input() dragGrid: {gridColSize: number, gridRowSize: number} = {gridColSize: 1, gridRowSize: 1};
  @Input() useShadowClone: boolean = false;

  private originalOpacity = '1';
  private clickCoordinates = {x: 0, y: 0};
  private readyToDrag = false;
  private appDragStarted = false;

  private draggedElement: HTMLElement;

  constructor(
    private el: ElementRef<HTMLSpanElement>
  ) { }

  ngOnInit(): void {
    this.dragHandle.style.cursor = "pointer";
    this.dragHandle.style.userSelect = "none";
    this.dragHandle.addEventListener('mousedown', this.mousedownListener.bind(this));
  }

  public mousedownListener(event: MouseEvent) {
    const handleBoundRect = this.dragHandle.getBoundingClientRect();
    this.clickCoordinates.x = event.clientX - handleBoundRect.x;
    this.clickCoordinates.y = event.clientY - handleBoundRect.y;
    this.readyToDrag = true;
    document.addEventListener('mousemove', this.firstMouseMoveHandlerBinded);
    document.addEventListener('mouseup', this.mouseUpHandlerBinded);
      
    if (event.target === this.el.nativeElement) { //propagation stopps on first parent instance of directive
      event.preventDefault();
      event.stopPropagation();
      return false 
    }
  }

  @HostListener('dragstart')
  public dragstartListener(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  @HostListener('select')
  public selectListener(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  private firstMouseMoveHandlerBinded = this.firstMouseMoveHandler.bind(this);
  private firstMouseMoveHandler(event: MouseEvent) {
    if (
      this.readyToDrag &&
      (Math.abs(this.clickCoordinates.x - event.clientX) > this.dragThreshold.x ||
      Math.abs(this.clickCoordinates.y - event.clientY) > this.dragThreshold.y)
    ) {
      document.addEventListener('mouseover', this.appDragOverHandlerBinded);
      document.addEventListener('mouseout', this.appDragOutHandlerBinded);

      document.removeEventListener('mousemove', this.firstMouseMoveHandlerBinded);
      document.addEventListener('mousemove', this.positionDraggedElementBinded);

      this.appDragStarted = true;

      if(this.useShadowClone) {
        this.originalOpacity = this.el.nativeElement.style.opacity ? (this.el as any).nativeElement.style.opacity : this.originalOpacity;
        this.el.nativeElement.style.opacity = this.fadedOpacity;

        this.draggedElement = this.createShadowClone();
    
        document.body.append(this.draggedElement);
      } else {
        this.draggedElement = this.el.nativeElement;
      }

      this.positionDraggedElement(event);

      this.appDragStart.emit(event);
    }
    
    event.preventDefault();
    event.stopPropagation();
    return false 
  }

  private createShadowClone(): HTMLElement {
    const draggableElementSize = this.el.nativeElement.getBoundingClientRect();
    const draggableElementClone = (this.el as any).nativeElement.cloneNode(true) as HTMLElement;
    draggableElementClone.style.opacity = this.fadedOpacity;
    draggableElementClone.style.position = 'absolute';
    draggableElementClone.style.pointerEvents = 'none';
    draggableElementClone.style.zIndex = '99';
    draggableElementClone.style.width = draggableElementSize.width + 'px';
    draggableElementClone.style.height = draggableElementSize.height + 'px';
    draggableElementClone.style.marginLeft = -1 * draggableElementSize.width / 2 + 'px';
    draggableElementClone.style.marginTop = -1 * draggableElementSize.height / 2 + 'px';
    return draggableElementClone;
  }

  private positionDraggedElementBinded = this.positionDraggedElement.bind(this);
  private positionDraggedElement(event: MouseEvent) {
    this.draggedElement.style.left = this.countGridPosition(event.pageX, this.dragGrid.gridColSize, this.dragZeroPoint.left, this.clickCoordinates.x) + 'px';
    this.draggedElement.style.top = this.countGridPosition(event.pageY, this.dragGrid.gridRowSize, this.dragZeroPoint.top, this.clickCoordinates.y) + 'px';
    
    event.preventDefault();
    event.stopPropagation();
    return false 
  }

  private countGridPosition(cursorPosition: number, gridDimentionSize: number, zeroPointCorrection: number, clickCorrection: number) {
    let output = cursorPosition - zeroPointCorrection - clickCorrection;
    if (gridDimentionSize !== 1) {
      output = Math.round(output / gridDimentionSize) * gridDimentionSize;
    }
    return Math.max(0, output)
  }
  
  private mouseUpHandlerBinded = this.mouseUpHandler.bind(this);
  private mouseUpHandler(event: MouseEvent) {
    this.readyToDrag = false;
  
    if (this.appDragStarted) {
      (this.el as any).nativeElement.style.opacity = this.originalOpacity;

      if(this.useShadowClone) {
        this.draggedElement.remove();
      }

      this.appDragStarted = false;

      this.appDragDrop.emit(event);
    }

    document.removeEventListener('mousemove', this.positionDraggedElementBinded);
    document.removeEventListener('mousemove', this.firstMouseMoveHandlerBinded);
    document.removeEventListener('mouseup', this.mouseUpHandlerBinded);
    document.removeEventListener('mouseover', this.appDragOverHandlerBinded);
    document.removeEventListener('mouseout', this.appDragOutHandlerBinded);

    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  private appDragOverHandlerBinded = this.appDragOverHandler.bind(this);
  private appDragOverHandler(e: MouseEvent): void {
    this.appDragOver.emit(e);
  }

  private appDragOutHandlerBinded = this.appDragOutHandler.bind(this);
  private appDragOutHandler(e: MouseEvent): void {
    this.appDragOut.emit(e);
  }
}
