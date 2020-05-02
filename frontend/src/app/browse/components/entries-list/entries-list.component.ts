import { Component, OnInit, Input } from '@angular/core';
import { Note } from 'types';
import { ApiService } from '@/api-service';

@Component({
  selector: '[app-entries-list]',
  templateUrl: './entries-list.component.html',
  styleUrls: ['./entries-list.component.less']
})
export class EntriesListComponent implements OnInit {
  @Input() notes: Partial<Note['Record'][]>;

  constructor(
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.notes.forEach(note => {
      if (note.childNotes && note.childNotes.length) {
        note.childNotes
      }
    });
  }

  // public deleteNoteById(noteId: Note['Record']['_id']) {
  //   console.log('deleting note with id', noteId, 'now...')
  //   this.apiService.note.deleteNoteById(noteId).subscribe();
  // }
}
