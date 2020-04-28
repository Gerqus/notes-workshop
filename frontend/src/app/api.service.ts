import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { INoteModel, INoteRecord, INoteResponse } from 'types';

import { ConfigService } from './config.service';

import { joinURLSegments } from '@/utils';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private endpointsUrl: string;
  private notesListSubject = new Subject<INoteResponse>();

  private getEndpointFor(endpointName: string, ...params: string[]) {
    if (this.configService.api[endpointName] === undefined) {
      throw new Error(`Endpoint "${endpointName}" is not defined. Add it's url to config.`);
    }

    return this.configService.api.protocol + "://" +
      joinURLSegments(
        this.configService.api.host,
        this.endpointsUrl,
        this.configService.api[endpointName],
        ...params.map(encodeURI)
      );
  }

  constructor(
    private configService: ConfigService,
    private httpClient: HttpClient
  ) {
    this.endpointsUrl = this.configService.api.root;
  }

  public addNote(note: INoteModel): Promise<INoteResponse> {
    console.log('POST', this.getEndpointFor('note'));
    return this.httpClient.post<INoteResponse>(
      this.getEndpointFor('note'),
      note
    )
    .toPromise();
  }

  public fetchNotes(): Promise<INoteResponse> {
    console.log('GET', this.getEndpointFor('note'));
    return this.httpClient.get<INoteResponse>(
      this.getEndpointFor('note'),
      {}
    )
    .toPromise();
  }

  public deleteNote(noteId: INoteRecord['_id']): Promise<INoteResponse> {
    console.log('DELETE', this.getEndpointFor('note', noteId));
    return this.httpClient.delete<INoteResponse>(
      this.getEndpointFor('note', noteId),
      {}
    )
    .toPromise();
  }

  public updateNotesList(): void {
    console.log('GET', this.getEndpointFor('note'));
    this.fetchNotes()
      .then(res => {
        this.notesListSubject.next(res);
      });
  }

  public getNotesListSubject(): Subject<INoteResponse> {
    return this.notesListSubject;
  }
}
