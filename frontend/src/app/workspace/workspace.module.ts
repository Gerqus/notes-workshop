import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WidgetModule } from '@/widget/widget.module';
import { ProjectCommonModule } from '@/common/common.module';
import { NotesViewModule } from '@/notes-view/notes-view.module';
import { BrowseModule } from '@/browse/browse.module';

import { LayoutComponent } from './components/layout/layout.component';

@NgModule({
  declarations: [
    LayoutComponent,
  ],
  imports: [
    CommonModule,
    WidgetModule,
    ProjectCommonModule,
    NotesViewModule,
    BrowseModule,
  ],
  exports: [
    LayoutComponent,
  ],
})
export class WorkspaceModule { }
