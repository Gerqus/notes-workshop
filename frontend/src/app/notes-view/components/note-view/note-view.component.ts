import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router'

import { Subscription } from 'rxjs';

import { Note } from 'types';

import { ApiService } from '@/api-service';

@Component({
  selector: 'app-note-view',
  templateUrl: './note-view.component.html',
  styleUrls: ['./note-view.component.less']
})
export class NoteViewComponent implements OnInit, OnDestroy {
  @ViewChild('noteTitle') noteTitleElement: {nativeElement: HTMLDivElement};
  @ViewChild('noteContent') noteContentElement: {nativeElement: HTMLDivElement};

  private routeNoteIdSubscription: Subscription;
  private noteId: Note['Record']['_id'];
  public note: Note['Record'];

  constructor(
    private activatedRoute: ActivatedRoute,
    private apiService: ApiService,
  ) { }

  ngOnInit(): void {
    this.routeNoteIdSubscription = this.activatedRoute.params
      .subscribe(async params => {
        this.noteId = params['noteId'];
        this.apiService.note.getNoteById(this.noteId)
          .subscribe((fetchedNote) => {
            this.note = fetchedNote;
          });
      });
  }

  ngOnDestroy(): void  {
    this.routeNoteIdSubscription.unsubscribe();
  }

  public saveNote() {
    this.apiService.note.updateNote({
      _id: this.note._id,
      title: this.noteTitleElement.nativeElement.innerHTML.replace(/<br>$/, ''),
      content: this.noteContentElement.nativeElement.innerHTML.replace(/<br>$/, ''),
    })
    .subscribe((newNote) => {
      this.note = newNote;
    });
  }

  public deleteNote() {
    this.apiService.note.deleteNote(this.note).subscribe();
  }

  public toggleCategory() {
    this.apiService.note.toggleCategory(this.note).subscribe();
  }

  public supportTabInput(e: KeyboardEvent) {
    let shouldPreventDefault = true;
    console.log(e.key, e);

    if (e.key === 'Tab') {
      document.execCommand('insertText', false, `\t`);
    } else 
    if (e.key === 's' && e.ctrlKey) {
      this.saveNote();
    } else {
      shouldPreventDefault = false;
    }

    if (shouldPreventDefault) {
      e.preventDefault();
      return false;
    }
  }
}
