import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router'

import { Subscription } from 'rxjs';

import { INoteRecord } from 'types';

import { ApiService } from '@/api.service';

@Component({
  selector: 'app-note-view',
  templateUrl: './note-view.component.html',
  styleUrls: ['./note-view.component.less']
})
export class NoteViewComponent implements OnInit, OnDestroy {
  private routeNoteIdSubscription: Subscription;
  private noteId: INoteRecord['_id'];
  public note: INoteRecord;

  constructor(
    private activatedRoute: ActivatedRoute,
    private apiService: ApiService,
  ) { }

  ngOnInit(): void {
    this.routeNoteIdSubscription = this.activatedRoute.params
      .subscribe(params => {
        this.noteId = params['noteId'];
        this.note = this.apiService.fetchNote(this.noteId);
      });
  }

  ngOnDestroy(): void  {
    this.routeNoteIdSubscription.unsubscribe();
  }

}
