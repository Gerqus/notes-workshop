import { Component, OnChanges, OnDestroy, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { Note } from 'types';
import { ApiService } from '@/api-service';

@Component({
  selector: 'app-entries-list',
  templateUrl: './entries-list.component.html',
  styleUrls: ['./entries-list.component.less']
})
export class EntriesListComponent implements OnChanges, OnDestroy {
  @Input() notes: Note['Record'][];
  public notesChildrenSubs: {
    [K: string]: Subscription
  } = {};
  public notesChildren: {
    [K: string]: Note['Record'][]
  } = {};

  constructor(
    private apiService: ApiService
  ) {}

  ngOnChanges(): void {
    const savedNotesIds = Object.keys(this.notesChildrenSubs);
    this.notes.forEach(note => {
      if (!savedNotesIds.includes(note._id)) {
        this.notesChildrenSubs[note._id] = this.apiService.note.getChildNotesListSub(note._id)
          .subscribe((childNotes) => {
            console.log('fetched children for', note._id, 'note:', childNotes)
            this.notesChildren[note._id] = childNotes;
          });
        this.apiService.note.refreshChildrenFor(note._id);
      } else {
        savedNotesIds.splice(savedNotesIds.indexOf(note._id), 1);
      }
      savedNotesIds.forEach(obsoleteNoteId => {
        this.notesChildrenSubs[obsoleteNoteId].unsubscribe();
        delete this.notesChildrenSubs[obsoleteNoteId];
      })
    });
  }

  ngOnDestroy(): void {
    Object.keys(this.notesChildrenSubs).forEach(noteId => {
      this.notesChildrenSubs[noteId].unsubscribe();
    });
  }

  public notesTrackingFn = (note: Note['Record']) => [note._id, ...((this.notesChildren[note._id] || []).map(note => note._id).sort())].join('.');
}
