import { Directive, HostListener, HostBinding, ElementRef, OnInit } from '@angular/core';
import { DraggableNoteEntryComponent } from '../components/draggable-note-entry/draggable-note-entry.component';

@Directive({
  selector: '[appDraggable]'
})
export class DraggableDirective implements OnInit {
  private readonly fadedOpacity = '0.4';
  private originalOpacity = '1';
  private readyToDrag = false;
  private dragStarted = false;
  private noteClone: HTMLElement;
  private clickCoordinates = {x: 0, y: 0};

  private mouseUpHandlerBinded = this.mouseUpHandler.bind(this);
  private firstMouseMoveHandlerBinded = this.firstMouseMoveHandler.bind(this);
  private positionNoteShadowBinded = this.positionNoteShadow.bind(this);
  private mouseOverHandlerBinded = this.mouseOverHandler.bind(this);
  private mouseOutHandlerBinded = this.mouseOutHandler.bind(this);

  @HostListener('mousedown', ['$event']) mousedownListener(event: MouseEvent) {
    this.clickCoordinates.x = event.clientX;
    this.clickCoordinates.y = event.clientY;
    this.readyToDrag = true;
    document.addEventListener('mousemove', this.firstMouseMoveHandlerBinded);
    document.addEventListener('mouseup', this.mouseUpHandlerBinded);
  };
  @HostListener('dragstart') dragstartListener() { return false };

  constructor(
    private el: ElementRef,
    private hostComponent: DraggableNoteEntryComponent
  ) { }

  ngOnInit(): void {}

  private canDropHere(elementToCheck: HTMLElement) {
    return elementToCheck.classList.contains('drop-zone') &&
    elementToCheck !== (this.el as any).nativeElement
  }

  private mouseOverHandler(event: MouseEvent) {
    if(this.canDropHere(event.target as HTMLElement)) {
      (event.target as HTMLElement).classList.add('indicate-drop-zone');
    }
  }

  private mouseOutHandler(event: MouseEvent) {
    (event.target as HTMLElement).classList.remove('indicate-drop-zone');
  }
  
  private mouseUpHandler(event: MouseEvent) {
    if (this.dragStarted) {
      (this.el as any).nativeElement.style.opacity = this.originalOpacity;
      this.noteClone.remove();
      this.dragStarted = false;
      document.body.classList.remove('drag-ongoing');

      if (this.canDropHere(event.target as HTMLElement)) {
        this.hostComponent.shouldUseRouter = true;
        console.log('Would move note', (this.el as any).nativeElement.innerHTML, 'under', (event.target as HTMLElement).innerHTML)
      }
    }
    this.readyToDrag = false;

    document.removeEventListener('mouseup', this.mouseUpHandlerBinded);
    document.removeEventListener('mousemove', this.positionNoteShadowBinded);
    document.removeEventListener('mousemove', this.firstMouseMoveHandlerBinded);
    document.removeEventListener('mouseover', this.mouseOverHandlerBinded);
    document.removeEventListener('mouseout', this.mouseOutHandlerBinded);
  }

  private firstMouseMoveHandler(event: MouseEvent) {
    if (
      this.readyToDrag &&
      (Math.abs(this.clickCoordinates.x - event.clientX) > 2 ||
      Math.abs(this.clickCoordinates.y - event.clientY) > 2)
    ) {

      /*
       * Variable below is helper variable preventing host element from navigating away if drag'n'drop was completed over same element it was started on (like pick from A and drop back to A) in wich case a reagular (click) event is fired on host component.
       * Set this variable to true in this directive only if drag was dropped on antoher element that dragged one (eg. dragging A and dropping it on B, not back on A).
       * Host component sets it to true on it's own when mentioned (click) callback is called on droping A back to A, resulting in unlocking navigation after such action.
       */
      this.hostComponent.shouldUseRouter = false;

      document.addEventListener('mouseover', this.mouseOverHandlerBinded);
      document.addEventListener('mouseout', this.mouseOutHandlerBinded);

      document.removeEventListener('mousemove', this.firstMouseMoveHandlerBinded);
      document.addEventListener('mousemove', this.positionNoteShadowBinded);

      this.dragStarted = true;

      this.originalOpacity = (this.el as any).nativeElement.style.opacity ? (this.el as any).nativeElement.style.opacity : this.originalOpacity;
      (this.el as any).nativeElement.style.opacity = this.fadedOpacity;

      this.noteClone = (this.el as any).nativeElement.cloneNode(true) as HTMLElement;
      this.noteClone.style.opacity = this.fadedOpacity;
      this.noteClone.style.position = 'absolute';
      document.body.classList.add('drag-ongoing');
      this.noteClone.style.cursor = "move";
      this.positionNoteShadow(event);
      this.noteClone.style.zIndex = '1000';
      document.body.append(this.noteClone);
    }
  }

  private positionNoteShadow(event: MouseEvent) {
    this.noteClone.style.left = event.pageX + 'px';
    this.noteClone.style.top = event.pageY + 'px';
  }
}
