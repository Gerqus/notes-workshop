import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router'

import { Subscription, Subject } from 'rxjs';

import { Note } from 'types';

import { NoteApiService } from '@/api-service/note.api.service';

@Component({
  selector: 'app-note-view',
  templateUrl: './note-view.component.html',
  styleUrls: ['./note-view.component.less']
})
export class NoteViewComponent implements OnInit, OnDestroy {
  @ViewChild('noteTitle') noteTitleElement: {nativeElement: HTMLDivElement};
  @ViewChild('noteContent') noteContentElement: {nativeElement: HTMLDivElement};

  private routeNoteIdSubscription: Subscription;
  private noteId: Note.Record['_id'];
  public note: Note.Record;

  constructor(
    private activatedRoute: ActivatedRoute,
    private noteApiService: NoteApiService,
  ) { }

  ngOnInit(): void {
    this.routeNoteIdSubscription = this.activatedRoute.params
      .subscribe(async params => {
        this.noteId = params['noteId'];
        this.note = await this.noteApiService.fetchNote(this.noteId);
      });
  }

  ngOnDestroy(): void  {
    this.routeNoteIdSubscription.unsubscribe();
  }

  public saveNote() {
    const sub = this.noteApiService.saveNote({
      _id: this.note._id,
      title: this.noteTitleElement.nativeElement.innerHTML.replace(/<br>$/, ''),
      content: this.noteContentElement.nativeElement.innerHTML.replace(/<br>$/, ''),
    })
      .subscribe((newNote) => {
        console.log('inside subscription')
        this.note = newNote;
        sub.unsubscribe();
      });
  }

}
