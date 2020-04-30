import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router'

import { Subscription } from 'rxjs';

import { Note } from 'types';

import { ApiService } from '@/api-service';

@Component({
  selector: 'app-note-view',
  templateUrl: './note-view.component.html',
  styleUrls: ['./note-view.component.less']
})
export class NoteViewComponent implements OnInit, OnDestroy {
  @ViewChild('noteTitle') noteTitleElement: {nativeElement: HTMLDivElement};
  @ViewChild('noteContent') noteContentElement: {nativeElement: HTMLDivElement};

  private routeNoteIdSubscription: Subscription;
  private noteId: Note['Record']['_id'];
  public note: Note['Record'];

  constructor(
    private activatedRoute: ActivatedRoute,
    private apiService: ApiService,
  ) { }

  ngOnInit(): void {
    this.routeNoteIdSubscription = this.activatedRoute.params
      .subscribe(async params => {
        this.noteId = params['noteId'];
        this.note = await this.apiService.note.fetchNoteById(this.noteId);
      });
  }

  ngOnDestroy(): void  {
    this.routeNoteIdSubscription.unsubscribe();
  }

  public saveNote() {
    this.apiService.note.saveNote({
      _id: this.note._id,
      title: this.noteTitleElement.nativeElement.innerHTML.replace(/<br>$/, ''),
      content: this.noteContentElement.nativeElement.innerHTML.replace(/<br>$/, ''),
    })
    .subscribe((newNote) => {
      this.note = newNote;
    });
  }

}
