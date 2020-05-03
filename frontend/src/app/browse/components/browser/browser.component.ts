import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '@/api-service/';

import { Subscription } from 'rxjs';

import { Note } from 'types';

@Component({
  selector: 'app-browser',
  templateUrl: './browser.component.html',
  styleUrls: ['./browser.component.less']
})
export class BrowserComponent implements OnInit, OnDestroy {
  public notesGroupsOrderByNames: string[] = [];
  private notesGroupsOrderSub: Subscription;
  private notesListSub: Subscription;

  public notes: Note['Record'][];

  constructor(
    private apiService: ApiService,
  ) {}

  ngOnInit(): void {
    this.notesListSub = this.apiService.note.getTopMostNotes()
      .subscribe((topNotes) => {
        console.log('fetched top')
        this.notes = topNotes;
      });
  }

  ngOnDestroy(): void {
    this.notesGroupsOrderSub.unsubscribe();
    this.notesListSub.unsubscribe();
  }
}
