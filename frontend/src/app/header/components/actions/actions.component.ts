import { Component, OnInit } from '@angular/core';
import { NoteApiService } from '@/api-service/note.api.service';

@Component({
  selector: 'app-actions',
  templateUrl: './actions.component.html',
  styleUrls: ['./actions.component.less']
})
export class ActionsComponent implements OnInit {

  constructor(private noteApiService: NoteApiService) { }

  ngOnInit(): void {
  }

  public newNote() {
    const sub = this.noteApiService.addNote({
      title: 'New Note',
      content: '',
    })
    .subscribe(() => {
      sub.unsubscribe();
    });
  }
}
