import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProjectCommonModule } from '../common/common.module';

import { WidgetComponent } from './widget.component';

@NgModule({
  declarations: [
    WidgetComponent
  ],
  imports: [
    CommonModule,
    ProjectCommonModule
  ],
  exports: [
    WidgetComponent
  ]
})
export class WidgetModule { }
