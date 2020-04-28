import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from './components/layout/layout.component';
import { AppRoutingModule } from '@/app-routing.module';
import { NoteViewComponent } from './components/note-view/note-view.component';

@NgModule({
  declarations: [
    LayoutComponent,
    NoteViewComponent
  ],
  imports: [
    CommonModule,
    AppRoutingModule
  ],
  exports: [
    LayoutComponent
  ]
})
export class NotesViewModule { }
