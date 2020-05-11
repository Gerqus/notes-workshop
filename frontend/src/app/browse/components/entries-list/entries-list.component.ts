import { Component, OnChanges, OnDestroy, Input } from '@angular/core';
// import { Subscription } from 'rxjs';
import { Note } from 'types';
// import { NotesControllerService } from '@/services/notes-controller';
import { NoteIndexRecord } from '@/services/notes-controller/note-index-record.class';

@Component({
  selector: 'app-entries-list',
  templateUrl: './entries-list.component.html',
  styleUrls: ['./entries-list.component.less']
})
export class EntriesListComponent implements OnChanges, OnDestroy {
  @Input() notes: NoteIndexRecord[];
  @Input() browserReference: HTMLElement;
  // public notesChildrenSubs: {
  //   [K: string]: Subscription
  // } = {};
  // public notesChildren: {
  //   [K: string]: NoteIndexRecord[]
  // } = {};

  constructor(
    // private notesControllerService: NotesControllerService
  ) { }

  ngOnChanges(): void {
  //   const savedNotesIds = Object.keys(this.notesChildrenSubs);
  //   this.notes.forEach(note => {
  //     if (!savedNotesIds.includes(note._id)) {
  //       this.notesChildrenSubs[note._id] = this.notesControllerService.getFromIndex(note)
  //         .subscribe((childNotes) => {
  //           this.notesChildren[note._id] = childNotes;
  //         });
  //       this.notesControllerService.refreshChildrenFor(note._id);
  //     } else {
  //       savedNotesIds.splice(savedNotesIds.indexOf(note._id), 1);
  //     }
  //     savedNotesIds.forEach(obsoleteNoteId => {
  //       if (this.notesChildrenSubs[obsoleteNoteId]) {
  //         delete this.notesChildrenSubs[obsoleteNoteId];
  //       }
  //     })
  //   });
  }

  ngOnDestroy(): void {
  //   Object.keys(this.notesChildrenSubs).forEach(noteId => {
  //     this.notesChildrenSubs[noteId].unsubscribe();
  //   });
  }

  // public notesTrackingFn = (index: number, note: Note['Record']) => [note._id, ...((this.notesChildren[note._id] || []).map(note => note._id).sort())].join('.');
  public notesTrackingFn = (index: number, note: Note['Record']) => note._id;

  // public getSourceNoteObservable(note: Note['Record']): Observable<Note['Record']> {
  //   if (note.isLink) {
  //     return new Observable((subscriber) => {
  //       this.apiService.note.getNoteFromLink(note)
  //         .subscribe(sourceNote => {
  //           subscriber.next(sourceNote);
  //           subscriber.complete();
  //         });
  //     })
  //   } else {
  //     return rxjs.of(note);
  //   }
  // }
}
