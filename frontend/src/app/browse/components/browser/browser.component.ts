import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { NotesControllerService } from '@/services/notes-controller';

import { Subscription, forkJoin } from 'rxjs';

import { NoteIndexRecord } from '@/services/notes-controller/note-index-record.class';

@Component({
  selector: 'app-browser',
  templateUrl: './browser.component.html',
  styleUrls: ['./browser.component.less']
})
export class BrowserComponent implements OnInit, OnDestroy {
  public notesGroupsOrderByNames: string[] = [];
  private topNotesListSub: Subscription;
  private topNotesContainer: NoteIndexRecord;

  public notes: NoteIndexRecord[];
  public topNotesParentKey = this.notesControllerService.topNotesParentKey;

  constructor(
    private notesControllerService: NotesControllerService,
    public browser: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    this.notesControllerService.isReady
      .subscribe((controllerReady) => {
        if (controllerReady) {
          this.topNotesContainer = this.notesControllerService.getFromIndex(this.topNotesParentKey);
          this.notesControllerService.indexChildrenFor(this.topNotesContainer)
            .subscribe((initialTopNotes) => {
              console.log('top notes indexed')
              forkJoin(
                ...initialTopNotes.map(topNote => this.notesControllerService.indexChildrenFor(topNote))
              ).subscribe();
              this.topNotesListSub = this.topNotesContainer.childNotes
                .subscribe((topNotes) => {
                  console.log('top notes fetched; from browser')
                  this.notes = topNotes;
                });
            });
        }
      })
  }

  ngOnDestroy(): void {
    this.topNotesListSub.unsubscribe();
  }
}
