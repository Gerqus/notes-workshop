import { Component, OnInit, OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs';

import { DragulaService } from 'ng2-dragula';
import { Note } from '@/interfaces/note.interface';

@Component({
  selector: 'app-browser',
  templateUrl: './browser.component.html',
  styleUrls: ['./browser.component.less']
})
export class BrowserComponent implements OnInit, OnDestroy {
  public notesGroupsOrderByNames: string[] = [];
  private notesGroupsOrderSub: Subscription;

  public notes: Note[] = [
    {
      name: 'Favourite one has really long title that won\'t fit in one line...',
      id: 'favourite-one',
    }, {
      name: 'Favourite two',
      id: 'favourite-two',
      subentries: [{
        name: 'Favourite one',
        id: 'favourite-one',
      }, {
        name: 'Favourite two',
        id: 'favourite-two',
        subentries: [{
          name: 'Favourite one',
          id: 'favourite-one',
        }, {
          name: 'Favourite two',
          id: 'favourite-two',
        }]
      }]
    }, {
      name: 'Some Notey',
      id: 'some-notey',
      subentries: [{
        name: 'Favourite one',
        id: 'favourite-one',
      }, {
        name: 'Favourite two',
        id: 'favourite-two',
        subentries: [{
          name: 'Favourite one',
          id: 'favourite-one',
        }, {
          name: 'Favourite two',
          id: 'favourite-two',
        }]
      }]
    }, {
      name: 'Other Notey',
      id: 'other-notey',
    }, {
      name: 'Some Folder also has long name that will take at least two or three lines',
      id: 'some-folder',
      subentries: [{
        name: 'Favourite one',
        id: 'favourite-one',
      }, {
        name: 'Favourite two',
        id: 'favourite-two',
        subentries: [{
          name: 'Favourite one',
          id: 'favourite-one',
        }, {
          name: 'Favourite two',
          id: 'favourite-two',
        }]
      }]
    }
  ];

  constructor(private dragulaServie: DragulaService) {
  }

  ngOnInit(): void {
    this.dragulaServie.createGroup('notes-groups', {
      moves: (el, container, handle) => {
        return handle.classList.contains('handle');
      }
    });
    this.notesGroupsOrderSub = this.dragulaServie.dragend('notes-groups')
      .subscribe(this.changeGroupsOrder);
    this.notesGroupsOrderByNames = Object.keys(this.notes);
  }

  ngOnDestroy(): void {
    this.notesGroupsOrderSub.unsubscribe();
  }

  changeGroupsOrder(...args: any): void {
    console.log(args);
  }
}
