import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { ProjectCommonModule } from '../common/common.module';

import { BrowserComponent } from './components/browser/browser.component';
import { EntriesListComponent } from './components/entries-list/entries-list.component';

import { DraggableNoteEntryComponent } from './components/draggable-note-entry/draggable-note-entry.component';
import { DropZoneDirective } from './directives/drop-zone.directive';
import { BrowsersSectionComponent } from './components/browsers-section/browsers-section.component';

@NgModule({
  declarations: [
    BrowserComponent,
    EntriesListComponent,
    DraggableNoteEntryComponent,
    DropZoneDirective,
    BrowsersSectionComponent,
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
