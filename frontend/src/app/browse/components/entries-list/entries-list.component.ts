import { Component, OnInit, Input } from '@angular/core';
import { Note } from 'types';
import { NoteApiService } from '@/api-service/note.api.service';

@Component({
  selector: '[app-entries-list]',
  templateUrl: './entries-list.component.html',
  styleUrls: ['./entries-list.component.less']
})
export class EntriesListComponent implements OnInit {
  @Input() entriesList: Note.Record[];

  constructor(
    private noteApiService: NoteApiService
  ) {}

  ngOnInit(): void {}

  public entriesTrackingFn = (entry: Note.Record) => entry.title;

  public deleteNote(noteId: Note.Record['_id']) {
    console.log('deleting note with id', noteId, 'now...')
    const sub = this.noteApiService.deleteNote(noteId)
      .subscribe(() => {
        sub.unsubscribe();
      });
  }
}
