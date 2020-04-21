import { Component, OnInit, OnDestroy } from '@angular/core';
import { ENTRIES_TYPES } from '../../enums';
import { BrowserGroup } from '../../interfaces/browser-group.interface';

import { Subscription } from 'rxjs';

import { DragulaService } from 'ng2-dragula';

@Component({
  selector: 'app-browser',
  templateUrl: './browser.component.html',
  styleUrls: ['./browser.component.less']
})
export class BrowserComponent implements OnInit, OnDestroy {
  public ENTRIES_TYPES = ENTRIES_TYPES;
  public notesGroupsOrderByNames: string[] = [];
  private notesGroupsOrderSub: Subscription;

  public entries: BrowserGroup[] = [
    {
      name: 'favourites',
      entries: [{
        name: 'Favourite one has really long title that won\'t fit in one line...',
        type: ENTRIES_TYPES.NOTE,
        id: 'favourite-one',
      }, {
        name: 'Favourite two',
        type: ENTRIES_TYPES.NOTE,
        id: 'favourite-two',
        subentries: [{
          name: 'Favourite one',
          type: ENTRIES_TYPES.NOTE,
          id: 'favourite-one',
        }, {
          name: 'Favourite two',
          type: ENTRIES_TYPES.NOTE,
          id: 'favourite-two',
          subentries: [{
            name: 'Favourite one',
            type: ENTRIES_TYPES.NOTE,
            id: 'favourite-one',
          }, {
            name: 'Favourite two',
            type: ENTRIES_TYPES.NOTE,
            id: 'favourite-two',
          }]
        }]
      }],
    }, {
      name: 'notes',
      entries: [{
        name: 'Some Notey',
        type: ENTRIES_TYPES.NOTE,
        id: 'some-notey',
        subentries: [{
          name: 'Favourite one',
          type: ENTRIES_TYPES.NOTE,
          id: 'favourite-one',
        }, {
          name: 'Favourite two',
          type: ENTRIES_TYPES.NOTE,
          id: 'favourite-two',
          subentries: [{
            name: 'Favourite one',
            type: ENTRIES_TYPES.NOTE,
            id: 'favourite-one',
          }, {
            name: 'Favourite two',
            type: ENTRIES_TYPES.NOTE,
            id: 'favourite-two',
          }]
        }]
      }, {
        name: 'Other Notey',
        type: ENTRIES_TYPES.NOTE,
        id: 'other-notey',
      }, {
        name: 'Some Folder also has long name that will take at least two or three lines',
        type: ENTRIES_TYPES.FOLDER,
        id: 'some-folder',
        subentries: [{
          name: 'Favourite one',
          type: ENTRIES_TYPES.NOTE,
          id: 'favourite-one',
        }, {
          name: 'Favourite two',
          type: ENTRIES_TYPES.NOTE,
          id: 'favourite-two',
          subentries: [{
            name: 'Favourite one',
            type: ENTRIES_TYPES.NOTE,
            id: 'favourite-one',
          }, {
            name: 'Favourite two',
            type: ENTRIES_TYPES.NOTE,
            id: 'favourite-two',
          }]
        }]
      }]
    }
  ];

  constructor(private dragulaServie: DragulaService) {
  }

  ngOnInit(): void {
    this.dragulaServie.createGroup('notes-groups', {

    });
    this.notesGroupsOrderSub = this.dragulaServie.dragend('notes-groups')
      .subscribe(this.changeGroupsOrder);
    this.notesGroupsOrderByNames = Object.keys(this.entries);
  }

  ngOnDestroy(): void {
    this.notesGroupsOrderSub.unsubscribe();
  }

  changeGroupsOrder(...args: any): void {
    console.log(args);
  }
}
