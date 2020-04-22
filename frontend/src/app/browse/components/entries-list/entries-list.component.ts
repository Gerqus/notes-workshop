import { Component, OnInit, Input } from '@angular/core';
import { BrowserEntry } from '../../interfaces/browser-entry.interface';

@Component({
  selector: '[app-entries-list]',
  templateUrl: './entries-list.component.html',
  styleUrls: ['./entries-list.component.less']
})
export class EntriesListComponent implements OnInit {
  @Input() entriesList: BrowserEntry[];

  constructor() { }

  ngOnInit(): void {
  }

  public entriesTrackingFn = (entry: BrowserEntry) => entry.id;
}
