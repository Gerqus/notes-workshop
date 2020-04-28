import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '@/api.service';

import { Subscription } from 'rxjs';

import { DragulaService } from 'ng2-dragula';
import { INoteRecord } from 'types';

@Component({
  selector: 'app-browser',
  templateUrl: './browser.component.html',
  styleUrls: ['./browser.component.less']
})
export class BrowserComponent implements OnInit, OnDestroy {
  public notesGroupsOrderByNames: string[] = [];
  private notesGroupsOrderSub: Subscription;
  private notesListSub: Subscription;

  public notes: INoteRecord[];

  constructor(
    private dragulaServie: DragulaService,
    private apiService: ApiService,
  ) {}

  ngOnInit(): void {
    this.notesListSub = this.apiService.getNotesListSubject()
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
