import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { NotesControllerService } from '@/services/notes-controller';

import { Subscription } from 'rxjs';

import { NoteIndexRecord } from '@/services/notes-controller/note-index-record.class';

@Component({
  selector: 'app-browser',
  templateUrl: './browser.component.html',
  styleUrls: ['./browser.component.less']
})
export class BrowserComponent implements OnInit, OnDestroy {
  public notesGroupsOrderByNames: string[] = [];
  private topNotesListSub: Subscription;

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
          this.topNotesListSub = this.notesControllerService.getObservableOfChildrenOf(this.topNotesParentKey)
            .subscribe((topNotes) => {
              this.notes = topNotes;
            });
        }
      })
  }

  ngOnDestroy(): void {
    this.topNotesListSub.unsubscribe();
  }
}
