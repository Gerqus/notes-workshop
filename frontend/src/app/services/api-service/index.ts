import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ConfigService } from '../config-service';

import { NoteApiService } from './note-api.service';
// import { NotesCategoryApiService } from './notes-category-api.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private endpointsUrl: string;

  public note: NoteApiService;
  // public noteCategories: NotesCategoryApiService;

  constructor(
    private configService: ConfigService,
    private httpClient: HttpClient,
  ) {
    this.note = new NoteApiService(
      this.configService,
      this.httpClient,
    );
    // this.noteCategories = new NotesCategoryApiService(
    //   this.configService,
    //   this.httpClient,
    //   this.configService.api.root,
    // );
  }
}