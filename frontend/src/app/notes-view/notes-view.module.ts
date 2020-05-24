import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from '@/app-routing.module';

import { ProjectCommonModule } from '@/common/common.module';

import { NoteViewComponent } from './components/note-view/note-view.component';

@NgModule({
  declarations: [
    NoteViewComponent,
  ],
  imports: [
    CommonModule,
    ProjectCommonModule,
    AppRoutingModule,
  ],
  exports: [
    NoteViewComponent,
  ]
})
export class NotesViewModule { }
