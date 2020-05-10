import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ExpandableDirective } from './directives/expandable/expandable.directive';
import { MarkHTMLSafePipe } from './pipes/mark-html-safe/mark-html-safe.pipe';

@NgModule({
  declarations: [
    ExpandableDirective,
    MarkHTMLSafePipe,
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ExpandableDirective,
    MarkHTMLSafePipe
  ]
})
export class ProjectCommonModule { }
