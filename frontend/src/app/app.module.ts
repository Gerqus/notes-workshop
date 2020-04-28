import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { HeaderModule } from './header/header.module';
import { BrowseModule } from './browse/browse.module';
import { WidgetModule } from './widget/widget.module';
import { NotesViewModule } from './notes-view/notes-view.module';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HeaderModule,
    BrowseModule,
    WidgetModule,
    HttpClientModule,
    NotesViewModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
