import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Note } from 'types';

import { ConfigService } from '../config.service';

import { joinURLSegments } from '@/utils';

interface indexedNotes {
  [noteId: string]: Note.Record;
}

@Injectable({
  providedIn: 'root'
})
export class NoteApiService {
  private endpointsUrl: string;
  private notesListSubject = new Subject<Note.Record[]>();
  private indexedNotes: indexedNotes = {};

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

  public addNote(noteToAdd: Note.Model): Observable<Note.Record> {
    console.log('POST', this.getEndpointFor('note'));
    return this.httpClient.post<Note.Response>(
      this.getEndpointFor('note'),
      noteToAdd
    )
    .pipe(map(noteResp => noteResp.object as Note.Record))
    .pipe(tap(() => this.updateNotesList()));
  }

  public fetchNotes(): Observable<Note.Record[]> {
    console.log('GET', this.getEndpointFor('note'));
    return this.httpClient.get<Note.Response>(
      this.getEndpointFor('note'),
      {}
    )
    .pipe(map(noteResp => noteResp.object as Note.Record[]));
  }

  public async fetchNote(searchedNoteId: Note.Record['_id']): Promise<Note.Record> {
    return new Promise((resolve) => {
      if (this.indexedNotes[searchedNoteId]) {
        resolve(this.indexedNotes[searchedNoteId]);
      } else {
        this.notesListSubject
          .subscribe(() => {
            resolve(this.indexedNotes[searchedNoteId])
          });
        this.updateNotesList();
      }
    })
  }

  public deleteNote(noteId: Note.Record['_id']): Observable<Note.Record> {
    console.log('DELETE', this.getEndpointFor('note', noteId));
    return this.httpClient.delete<Note.Response>(
      this.getEndpointFor('note', noteId),
      {}
    )
    .pipe(map(noteResp => noteResp.object as Note.Record))
    .pipe(tap(() => this.updateNotesList()));
  }

  public saveNote(noteToSave: Note.Record): Observable<Note.Record> {
    console.log('PATCH', this.getEndpointFor('note', noteToSave._id));
    // if (!noteToSave.title) {
    //   throw new Error('Note must have a title. Aborting note saving.');
    // }
    return this.httpClient.patch<Note.Response>(
      this.getEndpointFor('note', noteToSave._id),
      noteToSave
    )
    .pipe(tap((resp) => console.log('test of path resp:', resp)))
    .pipe(map(noteResp => noteResp.object as Note.Record))
    .pipe(tap(() => this.updateNotesList()));
  }

  public getNotesListSubject(): Subject<Note.Record[]> {
    return this.notesListSubject;
  }
}
