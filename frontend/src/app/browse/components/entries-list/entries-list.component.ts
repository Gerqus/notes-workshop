import { Component, OnInit, Input } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Note } from 'types';
import { ApiService } from '@/api-service';

@Component({
  selector: 'app-entries-list',
  templateUrl: './entries-list.component.html',
  styleUrls: ['./entries-list.component.less']
})
export class EntriesListComponent implements OnInit {
  @Input() notes: Partial<Note['Record']>[];
  public fetchedNotes: {[K: string] : Note['Record'][]} = {};

  constructor(
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.notes.forEach(note => {
      if(note.childNotes && note.childNotes.length) {
        const subscription = this.getChildNotes(note.childNotes)
          .subscribe((notes) => {
            this.fetchedNotes[note._id] = notes;
            subscription.unsubscribe();
          })
      }
    })
  }

  public notesTrackingFn = (note: Note['Record']) => note._id;

  public getChildNotes(childNotesIds: Note['Record']['_id'][]) {
    return forkJoin(childNotesIds.map(childNoteId => this.apiService.note.fetchNoteById(childNoteId)));
  }
}
