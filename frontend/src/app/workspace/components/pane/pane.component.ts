import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { NotesControllerService } from '@/services/notes-controller';
import { Note } from 'types';

@Component({
  selector: 'app-pane',
  templateUrl: './pane.component.html',
  styleUrls: ['./pane.component.less']
})
export class PaneComponent implements AfterViewInit {
  public openedNotesIds: Note['Record']['_id'][];
  public controllerReady = false;

  public coordinates = {top: 0, left: 0};
  private gridRemMultiplier = 3;
  public readonly dragGrid;

  constructor(
    private el: ElementRef<HTMLSpanElement>,
    private notesControllerService: NotesControllerService,
  ) {
    this.notesControllerService.getOpenedNotesIdsObservable()
      .subscribe(openedNotesIds => {
        this.openedNotesIds = openedNotesIds;
      });
    
    this.notesControllerService.isReady.subscribe((isReady) => {
      this.controllerReady = isReady;
    });

    const baseFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    this.dragGrid = {
      gridColSize: baseFontSize * this.gridRemMultiplier,
      gridRowSize: baseFontSize * this.gridRemMultiplier,
    };
  }

  ngAfterViewInit(): void {
    const rect = this.el.nativeElement.getBoundingClientRect()
    this.coordinates.top = rect.top;
    this.coordinates.left = rect.left;
    console.log(this.el.nativeElement, this.coordinates);
  }

  public closeNote(noteId: Note['Record']['_id']) {
    this.notesControllerService.saveNote(noteId).subscribe();
    this.notesControllerService.closeNote(noteId);
  }

  public getNotePath(noteId: Note['Record']['_id']): string {
    const noteToGetPathFor = this.notesControllerService.getFromIndex(noteId);
    let notePath = this.notesControllerService.getNotePath(noteToGetPathFor);
    if (noteToGetPathFor.isLink) {
      notePath.push(this.notesControllerService.getFromIndex(noteToGetPathFor.sourceNoteId).title);
    }
    return notePath.join (' / ');
  }

}
