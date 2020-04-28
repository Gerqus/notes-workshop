import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NoteViewComponent } from './notes-view/components/note-view/note-view.component';

const routes: Routes = [
  {
    path: 'note/:noteId',
    component: NoteViewComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
