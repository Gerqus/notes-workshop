import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserComponent } from './components/browser/browser.component';
import { ExpandableListDirective } from './directives/expandable-list/expandable-list.directive';

import { DragulaModule } from 'ng2-dragula';
import { EntriesListComponent } from './components/entries-list/entries-list.component';

@NgModule({
  declarations: [
    BrowserComponent,
    ExpandableListDirective,
    EntriesListComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    DragulaModule.forRoot(),
  ],
  exports: [
    BrowserComponent
  ]
})
export class BrowseModule { }
