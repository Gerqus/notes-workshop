import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ConfigService } from '../config-service';

import { NoteApiService } from './note-api.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  public note: NoteApiService;

  constructor(
    private configService: ConfigService,
    private httpClient: HttpClient,
  ) {
    this.note = new NoteApiService(
      this.configService,
      this.httpClient,
    );
  }
}