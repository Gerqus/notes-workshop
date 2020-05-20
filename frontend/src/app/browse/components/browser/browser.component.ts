import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { NotesControllerService } from '@/services/notes-controller';

import { Subscription, forkJoin } from 'rxjs';

import { NoteIndexRecord } from '@/services/notes-controller/note-index-record.class';
import { Note } from 'types';

@Component({
  selector: 'app-browser',
  templateUrl: './browser.component.html',
  styleUrls: ['./browser.component.less']
})
export class BrowserComponent implements OnInit, OnDestroy {
  private topNotesListSub: Subscription;
  private topNotesContainer: NoteIndexRecord;

  public notesIds: Note['Record']['_id'][];
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
          this.notesControllerService.insertChildrenFromServerFor(this.topNotesContainer)
            .subscribe((initialTopNotes) => {
              forkJoin(
                ...initialTopNotes.map(topNote => this.notesControllerService.insertChildrenFromServerFor(topNote))
              ).subscribe();
              if (this.topNotesListSub) {
                this.topNotesListSub.unsubscribe();
              }
              this.topNotesListSub = this.topNotesContainer.childNotesIds
                .subscribe((topNotesIds) => {
                  this.notesIds = [...topNotesIds];
                });
            });
        }
      })
  }

  ngOnDestroy(): void {
    this.topNotesListSub.unsubscribe();
  }
}
