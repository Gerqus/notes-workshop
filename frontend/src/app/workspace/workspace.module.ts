import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WidgetModule } from '@/widget/widget.module';
import { ProjectCommonModule } from '@/common/common.module';
import { NotesViewModule } from '@/notes-view/notes-view.module';
import { BrowseModule } from '@/browse/browse.module';

import { PaneComponent } from './components/pane/pane.component';

@NgModule({
  declarations: [
    PaneComponent,
  ],
  imports: [
    CommonModule,
    WidgetModule,
    ProjectCommonModule,
    NotesViewModule,
    BrowseModule,
  ],
  exports: [
    PaneComponent,
  ],
})
export class WorkspaceModule { }
