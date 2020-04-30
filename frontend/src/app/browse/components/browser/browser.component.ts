import { Component, OnInit, OnDestroy } from '@angular/core';
import { NoteApiService } from '@/api-service/note.api.service';

import { Subscription } from 'rxjs';

import { DragulaService } from 'ng2-dragula';
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

  public notes: Note.Record[];

  constructor(
    private dragulaServie: DragulaService,
    private noteApiService: NoteApiService,
  ) {}

  ngOnInit(): void {
    this.notesListSub = this.noteApiService.getNotesListSubject()
      .subscribe((resp) => {
        console.log('notes recived');
        this.notes = resp;
      });

    this.dragulaServie.createGroup('notes-groups', {
      moves: (el, container, handle) => {
        return handle.classList.contains('handle');
      }
    });
    this.notesGroupsOrderSub = this.dragulaServie.dragend('notes-groups')
      .subscribe(this.changeGroupsOrder);
  }

  ngOnDestroy(): void {
    this.notesGroupsOrderSub.unsubscribe();
    this.notesListSub.unsubscribe();
  }

  changeGroupsOrder(...args: any): void {
    console.log(args);
  }
}
