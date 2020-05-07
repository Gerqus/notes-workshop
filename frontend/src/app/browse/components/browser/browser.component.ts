import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { ApiService } from '@/services/api-service/';

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
  private topNotesListSub: Subscription;

  public notes: Note['Record'][];
  public topNotesParentKey = this.apiService.note.topNotesParentKey;

  constructor(
    private apiService: ApiService,
    public browser: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    this.topNotesListSub = this.apiService.note.getChildNotesListSub(this.apiService.note.topNotesParentKey)
      .subscribe((topNotes) => {
        this.notes = topNotes;
      });
    this.apiService.note.refreshChildrenFor(this.apiService.note.topNotesParentKey);
  }

  ngOnDestroy(): void {
    this.notesGroupsOrderSub.unsubscribe();
    this.topNotesListSub.unsubscribe();
  }
}
