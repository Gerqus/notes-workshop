import { Component, OnInit } from '@angular/core';
import { NotesControllerService } from '@/services/notes-controller';

@Component({
  selector: 'app-actions',
  templateUrl: './actions.component.html',
  styleUrls: ['./actions.component.less']
})
export class ActionsComponent implements OnInit {

  constructor(
    private notesControllerService: NotesControllerService
  ) { }

  ngOnInit(): void {
  }

  public newNote() {
    this.notesControllerService.createEmptyNote().subscribe();
  }
}
