import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { Note } from 'types';
import { NoteIndexRecord } from '@/services/notes-controller/note-index-record.class';
import { NotesControllerService } from '@/services/notes-controller';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-entries-list',
  templateUrl: './entries-list.component.html',
  styleUrls: ['./entries-list.component.less']
})
export class EntriesListComponent {
  @ViewChild('entryElement') entryElement: ElementRef<HTMLElement>;
  @Input() notes: NoteIndexRecord[];
  @Input() browserReference: HTMLElement;

  constructor(
    private notesControllerService: NotesControllerService
  ) { }

  // public notesTrackingFn = (index: number, note: Note['Record']) => [note._id, ...((this.notesChildren[note._id] || []).map(note => note._id).sort())].join('.');
  public notesTrackingFn = (index: number, note: Note['Record']) => note._id;

  public handleNoteExpansion(noteToLoadChildrenFor: NoteIndexRecord) {
    console.log('expanded!')
    forkJoin(
      ...noteToLoadChildrenFor.childNotes.getValue().map(childNote => this.notesControllerService.indexChildrenFor(childNote))
    ).subscribe();
  }
}
