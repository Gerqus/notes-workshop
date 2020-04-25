import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogoComponent } from './components/logo/logo.component';
import { HeaderComponent } from './components/header/header.component';
import { ActionsComponent } from './components/actions/actions.component';

import { SearchModule } from '@/search/search.module';

@NgModule({
  declarations: [
    LogoComponent,
    HeaderComponent,
    ActionsComponent
  ],
  imports: [
    CommonModule,
    SearchModule
  ],
  exports: [
    HeaderComponent
  ]
})
export class HeaderModule { }
