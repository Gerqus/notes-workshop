import { Component, Input, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { Note } from 'types';
import { NoteIndexRecord } from '@/services/notes-controller/note-index-record.class';
import { NotesControllerService } from '@/services/notes-controller';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-entries-list',
  templateUrl: './entries-list.component.html',
  styleUrls: ['./entries-list.component.less']
})
export class EntriesListComponent implements OnChanges{
  @ViewChild('entryElement') entryElement: ElementRef<HTMLElement>;
  @Input() notesIds: Note['Record']['_id'][];
  @Input() browserReference: HTMLElement;
  @Input() parentNoteId: Note['Record']['_id'];

  @ViewChild('afterEntryDropBetween') afterEntryDropBetween: ElementRef<HTMLElement>;
  @ViewChild('subentriesDropBetween') subentriesDropBetween: ElementRef<HTMLElement>;

  public notes: NoteIndexRecord[] = [];
  public topNotesParentKey = this.notesControllerService.topNotesParentKey;

  constructor(
    private notesControllerService: NotesControllerService
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    this.notes = (changes.notesIds.currentValue as Note['Record']['_id'][]).map(noteId => this.notesControllerService.getFromIndex(noteId));
  }

  // public notesTrackingFn = (index: number, note: NoteIndexRecord) => [note._id, ...(note.childNotesIds.getValue() || []), note.title].join('.');
  public notesTrackingFn = (index: number, note: Note['Record']) => note._id;

  public handleNoteExpansion(noteToLoadChildrenFor: NoteIndexRecord) {
    forkJoin(
      ...noteToLoadChildrenFor.childNotesIds.getValue()
      .map(childNoteId =>
        this.notesControllerService.insertChildrenFromServerFor(
          this.notesControllerService.getFromIndex(childNoteId)
        )
      )
    ).subscribe();
  }

  public getContentSourceNote(note: NoteIndexRecord) {
    return note.isLink ? this.notesControllerService.getFromIndex(note.sourceNoteId) : note;
  }
}
