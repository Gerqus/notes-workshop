import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { ProjectCommonModule } from '../common/common.module';

import { BrowserComponent } from './components/browser/browser.component';
import { EntriesListComponent } from './components/entries-list/entries-list.component';

import { DraggableDirective } from './directives/draggable.directive';
import { DraggableNoteEntryComponent } from './components/draggable-note-entry/draggable-note-entry.component';

@NgModule({
  declarations: [
    BrowserComponent,
    EntriesListComponent,
    DraggableDirective,
    DraggableNoteEntryComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    ProjectCommonModule,
    RouterModule,
  ],
  exports: [
    BrowserComponent
  ]
})
export class BrowseModule { }
