import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { INoteModel, INoteRecord, INoteResponse } from 'types';

import { ConfigService } from './config.service';

import { joinURLSegments } from '@/utils';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private endpointsUrl: string;
  private notesListSubject = new Subject<INoteRecord[]>();
  private indexedNotes: { [noteId: string]: INoteRecord } = {};

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

  private updateNotesList(): void {
    console.log('GET', this.getEndpointFor('note'));
    this.fetchNotes()
      .subscribe(res => {
        res.forEach(note => {
          this.indexedNotes[note._id] = note;
        });
        this.notesListSubject.next(res);
      });
  }

  constructor(
    private configService: ConfigService,
    private httpClient: HttpClient
  ) {
    this.endpointsUrl = this.configService.api.root;
    this.updateNotesList();
  }

  public addNote(noteToAdd: INoteModel): Observable<INoteRecord> {
    console.log('POST', this.getEndpointFor('note'));
    return this.httpClient.post<INoteResponse>(
      this.getEndpointFor('note'),
      noteToAdd
    )
    .pipe(map(noteResp => noteResp.object as INoteRecord))
    .pipe(tap(() => this.updateNotesList()));
  }

  public fetchNotes(): Observable<INoteRecord[]> {
    console.log('GET', this.getEndpointFor('note'));
    return this.httpClient.get<INoteResponse>(
      this.getEndpointFor('note'),
      {}
    )
    .pipe(map(noteResp => noteResp.object as INoteRecord[]));
  }

  public fetchNote(searchedNoteId: INoteRecord['_id']): INoteRecord {
    return this.indexedNotes[searchedNoteId];
  }

  public deleteNote(noteId: INoteRecord['_id']): Observable<INoteRecord> {
    console.log('DELETE', this.getEndpointFor('note', noteId));
    return this.httpClient.delete<INoteResponse>(
      this.getEndpointFor('note', noteId),
      {}
    )
    .pipe(map(noteResp => noteResp.object as INoteRecord))
    .pipe(tap(() => this.updateNotesList()));
  }

  public saveNote(noteToSave: INoteRecord) {
    console.log('PATCH', this.getEndpointFor('note', noteToSave._id));
    return this.httpClient.patch<INoteResponse>(
      this.getEndpointFor('note', noteToSave._id),
      noteToSave
    )
    .pipe(tap((resp) => console.log('test of path resp:', resp)))
    .pipe(map(noteResp => noteResp.object as INoteRecord))
    .pipe(tap(() => this.updateNotesList()));
  }

  public getNotesListSubject(): Subject<INoteRecord[]> {
    return this.notesListSubject;
  }
}
