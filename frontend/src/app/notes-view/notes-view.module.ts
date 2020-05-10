import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from '@/app-routing.module';

import { WidgetModule } from '@/widget/widget.module';

import { LayoutComponent } from './components/layout/layout.component';
import { NoteViewComponent } from './components/note-view/note-view.component';
import { ProjectCommonModule } from '@/common/common.module';

@NgModule({
  declarations: [
    LayoutComponent,
    NoteViewComponent
  ],
  imports: [
    CommonModule,
    WidgetModule,
    AppRoutingModule,
    ProjectCommonModule,
  ],
  exports: [
    LayoutComponent,
  ]
})
export class NotesViewModule { }
