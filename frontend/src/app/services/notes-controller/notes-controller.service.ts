import { Injectable } from '@angular/core';
import { Subscription, BehaviorSubject, Observable, concat } from 'rxjs';
import { map } from 'rxjs/operators';
import { Note } from 'types';
import { compact, some } from 'lodash';

import { ApiService } from '@/services/api-service';
import { NoteIndexRecord } from './note-index-record.class';

type noteActionCallback = (modifiedNote: Note['Record']) => void;

@Injectable({
  providedIn: 'root'
})
export class NotesControllerService {
  private readonly currentNoteRepresentationObservable: BehaviorSubject<Note['Record']> = new BehaviorSubject(null);

  private openedNotesObservable: BehaviorSubject<Note['Record'][]> = new BehaviorSubject([]);

  public topNotesParentKey = 'top';
  public isReady = new BehaviorSubject(false);

  private notesIndex: {
    [K: string]: NoteIndexRecord
  } = {};

  constructor(
    private apiService: ApiService,
  ) {
    this.indexNote({_id: this.topNotesParentKey} as Note['Record'])
      .subscribe(() => {
        console.log(this.notesIndex)
        this.isReady.next(true);
      });
  }

  public openNote(noteToOpen: Note['Record']): void {
    if (!this.isNoteOpened(noteToOpen)) {
      this.addCurrentNoteToOpened(noteToOpen);
    }
  }

  private isNoteOpened(noteToCheck: Note['Record']): boolean{
    return some(this.openedNotesObservable.getValue(), openedNote => openedNote._id === noteToCheck._id)
  }

  private addCurrentNoteToOpened(newNote: Note['Record']): void {
    const openingNoteIndex = this.getFromIndex(newNote._id);

    const currentList = this.openedNotesObservable.getValue();
    currentList.push(openingNoteIndex);
    const updatedList = currentList; // just for code semantics
    this.openedNotesObservable.next(updatedList);
  }

  public subscribeForNewNote(cb: (currentNote: Note['Record']) => void): Subscription {
    return this.currentNoteRepresentationObservable.subscribe(cb);
  }

  private updateChildFor(parentNote: NoteIndexRecord, modifiedChild: NoteIndexRecord): void {
    const currentCildren = this.notesIndex[parentNote._id].childNotes.getValue();
    const childPosition = currentCildren.findIndex((childNote) => {
      return childNote._id === modifiedChild._id
    });
    currentCildren.splice(childPosition, 1, modifiedChild);
    parentNote.childNotes.next(currentCildren);
  }

  public saveNote(
    noteToSaveId: Note['Record']['_id'],
    notesNewTitle: Note['Record']['title'],
    notesNewContent: Note['Record']['content'],
    cb?: noteActionCallback
  ): void {
    const initialNoteIndex = this.notesIndex[noteToSaveId];

    let needsSending = false;
  
    if (initialNoteIndex.title !== notesNewTitle) {
      initialNoteIndex.title = notesNewTitle;
      needsSending = true;
    }
    if (initialNoteIndex.content !== notesNewContent) {
      initialNoteIndex.content = notesNewContent;
      needsSending = true;
    }

    if (!needsSending) {
      return;
    }

    this.apiService.note.updateNote({
      _id: initialNoteIndex.contentSourceId,
      title: initialNoteIndex.title,
      content: initialNoteIndex.content
    })
    .subscribe((newNote) => {
      initialNoteIndex.title = newNote.title; // to show in browser actual content saved in database after sanitization
      initialNoteIndex.content = newNote.content; // to show in browser actual content saved in database after sanitization
      this.updateChildFor(initialNoteIndex.parentNote, initialNoteIndex);
      if (initialNoteIndex.isLink) {
        this.updateChildFor(initialNoteIndex.sourceNote.parentNote, initialNoteIndex.sourceNote);
      }
      cb && cb(newNote);
    });
  }

  public deleteNote(noteToDelete: NoteIndexRecord, cb?: noteActionCallback): void {
    this.apiService.note.deleteNote(noteToDelete)
      .subscribe((modifiedNote) => {
        noteToDelete.childNotes.complete();
        this.updateChildFor(noteToDelete.parentNote, noteToDelete);
        noteToDelete.linkNotes.forEach((linkToDelete) => this.deleteNote(linkToDelete));
        delete this.notesIndex[noteToDelete._id];
        cb && cb(modifiedNote);
      });
  }

  public toggleCategory(noteToToggle: NoteIndexRecord, cb?: noteActionCallback): void {
    noteToToggle.isCategory = !noteToToggle.isCategory;

    this.apiService.note.updateNote({
      _id: noteToToggle.contentSourceId,
      isCategory: noteToToggle.isCategory
    })
    .subscribe((newNote) => {
      noteToToggle.isCategory = newNote.isCategory;
      this.updateChildFor(noteToToggle.parentNote, noteToToggle);
      if (noteToToggle.isLink) {
        this.updateChildFor(noteToToggle.sourceNote.parentNote, noteToToggle.sourceNote);
      }
      cb && cb(newNote);
    });
  }

  public indexNote(noteToIndex: Note['Record'], shouldIndexChildren = true): Observable<NoteIndexRecord> {
    return new Observable<NoteIndexRecord>(subscriber => {
      this.getSourceNoteIndexFor(noteToIndex)
        .subscribe(sourceNoteIndex => {
          this.notesIndex[noteToIndex._id] = new NoteIndexRecord(
            noteToIndex,
            sourceNoteIndex,
            this.getParentOf(noteToIndex),
          );
          if (sourceNoteIndex) {
            this.addLinkNoteToIndex(sourceNoteIndex, this.notesIndex[noteToIndex._id]);
          }
          if (shouldIndexChildren) {
            this.insertChildrenFromServer(this.notesIndex[noteToIndex._id])
              .subscribe(() => {
                subscriber.next(this.notesIndex[noteToIndex._id]);
                subscriber.complete();
              });
          } else {
            subscriber.next(this.notesIndex[noteToIndex._id]);
            subscriber.complete();
          }
        })
    })
  }

  private addLinkNoteToIndex(sourceNote: NoteIndexRecord, linkNote: NoteIndexRecord): void {
    sourceNote.linkNotes.push(linkNote);
  }

  public getFromIndex(noteToRetriveId: Note['Record']['_id']): NoteIndexRecord {
    return this.notesIndex[noteToRetriveId] || null;
  }

  public getOpenedNotesObservable(): Observable<Note['Record'][]> {
    return this.openedNotesObservable;
  }

  public getObservableOfChildrenOf(noteId: Note['Record']['_id']): Observable<NoteIndexRecord[]> {
    return this.notesIndex[noteId].childNotes;
  }

  private getSourceNoteIndexFor(linkNote: Note['Record']): Observable<NoteIndexRecord | null> {
    return new Observable<NoteIndexRecord | null>(subscriber => {
      if (linkNote.isLink) {
        const sourceNoteIndex = this.getFromIndex(linkNote.sourceNoteId);
        if (sourceNoteIndex) {
          subscriber.next(sourceNoteIndex);
          subscriber.complete();
        } else {
          this.apiService.note.getSourceNoteFor(linkNote)
            .subscribe((sourceNote) => {
              this.indexNote(sourceNote, false)
                .subscribe((sourceNoteIndex) => {
                  subscriber.next(sourceNoteIndex);
                  subscriber.complete();
                });
            });
        }
      } else {
        subscriber.next(null);
        subscriber.complete();
      }
    })
  }

  private insertChildrenFromServer(parentNote: NoteIndexRecord): Observable<void> {
    return this.apiService.note.getNotesChildren(parentNote)
        .pipe(map(childNotes => {
          concat(
            ...childNotes.map(childNote => this.indexNote(childNote , false))
          )
            .subscribe(() => {
              const indexedChildren = compact(childNotes.map((childNote) => this.getFromIndex(childNote._id)));
              parentNote.childNotes.next(indexedChildren);
            });
        }));
  }

  private getParentOf(searchedChildNote: Note['Record']): NoteIndexRecord {
    return this.getFromIndex(searchedChildNote.parentNoteId);
  }
}
