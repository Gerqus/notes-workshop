import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Note } from 'types';

@Component({
  selector: 'app-draggable-note-entry',
  templateUrl: './draggable-note-entry.component.html',
  styleUrls: ['./draggable-note-entry.component.less']
})
export class DraggableNoteEntryComponent {
  @Input('note') public note: Note['Record'];
  public shouldUseRouter = true;

  constructor(
    private router: Router,
  ) { }

  public openNote(): void {
    if (this.shouldUseRouter) {
      this.router.navigate(['note', this.note._id]);
    } else {
      this.shouldUseRouter = true;
    }
  }

}
