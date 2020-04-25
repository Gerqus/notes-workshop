import { Component, OnInit, Input } from '@angular/core';
import { Note } from '@/interfaces/note.interface';

@Component({
  selector: '[app-entries-list]',
  templateUrl: './entries-list.component.html',
  styleUrls: ['./entries-list.component.less']
})
export class EntriesListComponent implements OnInit {
  @Input() entriesList: Note[];

  constructor() { }

  ngOnInit(): void {
  }

  public entriesTrackingFn = (entry: Note) => entry.id;
}
