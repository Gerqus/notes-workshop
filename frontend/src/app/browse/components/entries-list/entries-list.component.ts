import { Component, OnInit, Input } from '@angular/core';
import { INoteRecord } from 'types';
import { ApiService } from '@/api.service';

@Component({
  selector: '[app-entries-list]',
  templateUrl: './entries-list.component.html',
  styleUrls: ['./entries-list.component.less']
})
export class EntriesListComponent implements OnInit {
  @Input() entriesList: INoteRecord[];

  constructor(
    private apiService: ApiService
  ) {}

  ngOnInit(): void {}

  public entriesTrackingFn = (entry: INoteRecord) => entry.title;

  public deleteNote(noteId: INoteRecord['_id']) {
    console.log('deleting note with id', noteId, 'now...')
    const sub = this.apiService.deleteNote(noteId)
      .subscribe(() => {
        sub.unsubscribe();
      });
  }
}
