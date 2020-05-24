import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ExpandableDirective } from './directives/expandable/expandable.directive';
import { DraggableDirective } from './directives/draggable/draggable.directive';
import { MarkHTMLSafePipe } from './pipes/mark-html-safe/mark-html-safe.pipe';

@NgModule({
  declarations: [
    ExpandableDirective,
    DraggableDirective,
    MarkHTMLSafePipe,
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ExpandableDirective,
    DraggableDirective,
    MarkHTMLSafePipe,
  ]
})
export class ProjectCommonModule { }
