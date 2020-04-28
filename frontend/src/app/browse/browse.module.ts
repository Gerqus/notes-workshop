import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { ProjectCommonModule } from '../common/common.module';

import { BrowserComponent } from './components/browser/browser.component';
import { EntriesListComponent } from './components/entries-list/entries-list.component';

import { DragulaModule } from 'ng2-dragula';

@NgModule({
  declarations: [
    BrowserComponent,
    EntriesListComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    DragulaModule.forRoot(),
    ProjectCommonModule,
    RouterModule,
  ],
  exports: [
    BrowserComponent
  ]
})
export class BrowseModule { }
