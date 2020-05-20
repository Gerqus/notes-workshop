import { Component, OnInit } from '@angular/core';
import { NotesControllerService } from '@/services/notes-controller';
import { Note } from 'types';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.less']
})
export class LayoutComponent implements OnInit {
  public openedNotesIds: Note['Record']['_id'][];
  public controllerReady = false;

  constructor(
    private notesControllerService: NotesControllerService
  ) {
    this.notesControllerService.getOpenedNotesIdsObservable()
      .subscribe(openedNotesIds => {
        this.openedNotesIds = openedNotesIds;
      })
    
      this.notesControllerService.isReady.subscribe((isReady) => {
        this.controllerReady = isReady;
      })
  }

  ngOnInit(): void {
  }

}
