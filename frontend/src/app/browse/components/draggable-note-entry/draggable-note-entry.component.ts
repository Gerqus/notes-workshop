import { Component, Input, OnInit, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Note } from 'types';
import { ApiService } from '@/api-service';

@Component({
  selector: 'app-draggable-note-entry',
  templateUrl: './draggable-note-entry.component.html',
  styleUrls: ['./draggable-note-entry.component.less'],
})
export class DraggableNoteEntryComponent implements OnInit {
  @Input() note: Note['Record'];
  private shouldEnableRouter = true;

  constructor(
    private router: Router,
    private el: ElementRef<HTMLSpanElement>,
    private apiService: ApiService,
  ) { }

  ngOnInit(): void {}

  public openNote(): void {
    if (this.shouldEnableRouter) {
      this.router.navigate(['note', this.note._id]);
    } else {
      this.shouldEnableRouter = true;
    }
  }
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

  public mousedownListener(event: MouseEvent) {
    this.clickCoordinates.x = event.clientX;
    this.clickCoordinates.y = event.clientY;
    this.readyToDrag = true;
    document.addEventListener('mousemove', this.firstMouseMoveHandlerBinded);
    document.addEventListener('mouseup', this.mouseUpHandlerBinded);
  };

  public dragstartListener() { return false };

  public handleNoteDrop(e: CustomEvent<Note['Record']>) {
    this.apiService.note.moveNote(e.detail, this.note._id);
  }

  private canDropHere(elementToCheck: HTMLElement) {
    if (elementToCheck === this.el.nativeElement) {
      return false;
    }
    let hostLiElement: HTMLElement = this.el.nativeElement;
    while (hostLiElement !== null && !hostLiElement.classList.contains('entry')) {
      hostLiElement = hostLiElement.parentElement;
    }
    let targetLiElement: HTMLElement = elementToCheck;
    while (targetLiElement !== null && !targetLiElement.classList.contains('entry')) {
      targetLiElement = targetLiElement.parentElement;
    }

    return elementToCheck.classList.contains('drop-zone') &&
    hostLiElement !== targetLiElement
  }

  private mouseOverHandler(event: MouseEvent) {
    if (this.canDropHere(event.target as HTMLElement)) {
      (event.target as HTMLElement).classList.add('indicate-drop-zone');

      // TODO: add copying drag mode (for example with ctrl pressed) and indicate it with cursor
      // switch (this.getMovingMode()) {
      //   case 'copy': "(or link)"
      //     "set cursor to copy (or link) cursor";
      //     break;
      //   case 'move':
      //     "set cursor to copy cursor";
      //     break;
      // }
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
      this.mouseOutHandler(event);

      if (this.canDropHere(event.target as HTMLElement)) {
        this.shouldEnableRouter = false;
        const noteDropEvent = new CustomEvent<Note['Record']>('notedrop', {
          bubbles: false,
          detail: this.note,
        });
        event.target.dispatchEvent(noteDropEvent);
      }
    }
    this.readyToDrag = false;

    document.removeEventListener('mousemove', this.positionNoteShadowBinded);
    document.removeEventListener('mousemove', this.firstMouseMoveHandlerBinded);
    document.removeEventListener('mouseover', this.mouseOverHandlerBinded);
    document.removeEventListener('mouseout', this.mouseOutHandlerBinded);
    document.removeEventListener('mouseup', this.mouseUpHandlerBinded);
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

      document.body.classList.add('drag-ongoing');

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
