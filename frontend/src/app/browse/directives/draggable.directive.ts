import { Directive, Input, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[appDraggable]'
})
export class DraggableDirective implements OnInit {
  private readonly fadedOpacity = '0.4';
  private originalOpacity = '1';
  private readyToDrag = false;
  private dragStarted = false;
  private noteClone: HTMLElement;

  private mouseUpHandlerBinded = this.mouseUpHandler.bind(this);
  private mouseMoveHandlerBinded = this.mouseMoveHandler.bind(this);
  private mouseOverHandlerBinded = this.mouseOverHandler.bind(this);
  private mouseOutHandlerBinded = this.mouseOutHandler.bind(this);

  constructor(
    private el: ElementRef<HTMLUListElement>
  ) { }

  ngOnInit(): void {
    console.log('Making', this.el.nativeElement.innerText, 'note draggable by handler...');
    this.makeDraggable(this.el.nativeElement);
  }

  private canDropHere(elementToCheck: HTMLElement) {
    return elementToCheck.classList.contains('drop-zone') &&
    elementToCheck !== this.el.nativeElement
  }

  private mouseOverHandler(event: MouseEvent) {
    console.log('mouseover event', event);
    if(this.canDropHere(event.target as HTMLElement)) {
      (event.target as HTMLElement).classList.add('indicate-drop-zone');
    }
  }

  private mouseOutHandler(event: MouseEvent) {
    console.log('mouseout event', event);
    (event.target as HTMLElement).classList.remove('indicate-drop-zone');
  }
  
  private mouseUpHandler(event: MouseEvent) {
    if (this.dragStarted) {
      this.el.nativeElement.style.opacity = this.originalOpacity;
      this.noteClone.remove();
      this.dragStarted = false;
    }
    this.readyToDrag = false;

    document.removeEventListener('mouseup', this.mouseUpHandlerBinded);
    document.removeEventListener('mousemove', this.mouseMoveHandlerBinded);
    document.removeEventListener('mouseover', this.mouseOverHandlerBinded);
    document.removeEventListener('mouseout', this.mouseOutHandlerBinded);
    document.body.classList.remove('drag-ongoing');

    if (this.canDropHere(event.target as HTMLElement)) {
      console.log('Would move note', this.el.nativeElement.innerHTML, 'under', (event.target as HTMLElement).innerHTML)
    }
  }

  private mouseMoveHandler(event: MouseEvent) {
    if (!this.dragStarted && this.readyToDrag) {
      document.addEventListener('mouseover', this.mouseOverHandlerBinded);
      document.addEventListener('mouseout', this.mouseOutHandlerBinded);

      this.dragStarted = true;

      this.originalOpacity = this.el.nativeElement.style.opacity ? this.el.nativeElement.style.opacity : this.originalOpacity;
      this.el.nativeElement.style.opacity = this.fadedOpacity;

      this.noteClone = this.el.nativeElement.cloneNode(true) as HTMLElement;
      this.noteClone.style.opacity = this.fadedOpacity;
      this.noteClone.style.position = 'absolute';
      document.body.classList.add('drag-ongoing');
      this.noteClone.style.cursor = "move";
      this.positionNoteShadow(event);
      this.noteClone.style.zIndex = '1000';
      document.body.append(this.noteClone);
    } else if (this.readyToDrag) {
      this.positionNoteShadow(event);
    }
  }

  private makeDraggable(element: HTMLElement) {
    element.addEventListener('mousedown', () => {
      this.readyToDrag = true;

      document.addEventListener('mousemove', this.mouseMoveHandlerBinded);
      document.addEventListener('mouseup', this.mouseUpHandlerBinded);
    });
    element.addEventListener('dragstart', () => false);
  }

  private positionNoteShadow(event: MouseEvent) {
    this.noteClone.style.left = event.pageX + 'px';
    this.noteClone.style.top = event.pageY + 'px';
  }

}
