import { Component, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';

import { NotesControllerService } from '@/services/notes-controller';
import { NoteIndexRecord } from '@/services/notes-controller/note-index-record.class';
import { Observable } from 'rxjs';
import { Note } from 'types';

@Component({
  selector: 'app-note-view',
  templateUrl: './note-view.component.html',
  styleUrls: ['./note-view.component.less']
})
export class NoteViewComponent {
  @ViewChild('noteTitle') noteTitleElement: {nativeElement: HTMLDivElement};
  @ViewChild('noteContent') noteContentElement: {nativeElement: HTMLDivElement};
  @Input('noteId') noteId: Note['Record']['_id'];

  public note: NoteIndexRecord;
  public sourceNote: NoteIndexRecord;

  constructor(
    private notesControllerService: NotesControllerService,
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.noteId.currentValue !== changes.noteId.previousValue) {
      this.note = this.notesControllerService.getFromIndex(changes.noteId.currentValue);
      if(this.note.isLink) {
        this.sourceNote = this.notesControllerService.getFromIndex(this.note.sourceNoteId);
      }
    }
  }

  public saveNote() {
    const titleToSave = this.noteTitleElement.nativeElement.innerHTML.replace(/<br\/?>$/, '');
    const contentToSave = this.noteContentElement.nativeElement.innerHTML.replace(/<br\/?>$/, '');

    this.notesControllerService.saveNote(this.sourceNote ? this.sourceNote : this.note, titleToSave, contentToSave)
      .subscribe();
  }

  public deleteNote() {
    console.log(0)
    this.notesControllerService.deleteNote(this.note)
      .subscribe(() => {
        console.log(13)
        this.notesControllerService.closeNote(this.note);
      });
  }

  public toggleCategory() {
    this.notesControllerService.toggleCategory(this.sourceNote ? this.sourceNote : this.note)
      .subscribe();
  }

  public closeNote() {
    this.saveNote()
    this.notesControllerService.closeNote(this.note);
  }

  public supportTitleHotkeys(e: KeyboardEvent) {
    let shouldPreventDefault = true;

    if (e.key === 'Enter') {
      this.noteContentElement.nativeElement.focus();
      this.saveNote();
    } else
    if (e.key === 's' && e.ctrlKey) {
      this.saveNote();
    } else
    {
      shouldPreventDefault = false;
    }

    if (shouldPreventDefault) {
      e.preventDefault();
      return false;
    }
  }

  public supportContentHotkeys(e: KeyboardEvent) {
    let shouldPreventDefault = true;

    if (e.key === 'Tab') {
      document.execCommand('insertText', false, `\t`);
    } else
    if (e.key === 's' && e.ctrlKey) {
      this.saveNote();
    } else
    if (e.key === 'b' && e.ctrlKey) {
      document.execCommand('bold', false);
    } else
    {
      shouldPreventDefault = false;
    }

    if (shouldPreventDefault) {
      e.preventDefault();
      return false;
    }
  }
}
