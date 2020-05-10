import { Component, OnInit } from '@angular/core';
import { NotesControllerService } from '@/services/notes-controller';
import { Note } from 'types';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.less']
})
export class LayoutComponent implements OnInit {
  public openedNotes: Note['Record'][];
  public controllerReady = false;

  constructor(
    private notesControllerService: NotesControllerService
  ) {
    this.notesControllerService.getOpenedNotesObservable()
      .subscribe(openedNotes => {
        this.openedNotes = openedNotes;
      })
    
      this.notesControllerService.isReady.subscribe((isReady) => {
        this.controllerReady = isReady;
      })
  }

  ngOnInit(): void {
  }

}
