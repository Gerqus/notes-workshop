import { Component, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';

import { NotesControllerService } from '@/services/notes-controller';
import { NoteIndexRecord } from '@/services/notes-controller/note-index-record.class';
import { Note } from 'types';
import { debounce } from 'lodash-es';

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

  public saveNote(): void {
    this.syncTitle();
    this.syncContent();
    this.notesControllerService.saveNote(this.noteId).subscribe();
  }

  public deleteNote() {
    this.notesControllerService.deleteNote(this.note)
      .subscribe(() => {
        this.notesControllerService.closeNote(this.noteId);
      });
  }

  public toggleCategory() {
    this.notesControllerService.toggleCategory(this.sourceNote ? this.sourceNote : this.note)
      .subscribe();
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

  public syncTitleDebounced = debounce(this.syncTitle, 330);
  private syncTitle(): void {
    this.note.title = this.noteTitleElement.nativeElement.innerHTML.replace(/<br\/?>$/, '');
  }

  public syncContentDebounced = debounce(this.syncContent, 330);
  private syncContent(): void {
    this.note.content = this.noteContentElement.nativeElement.innerHTML.replace(/<br\/?>$/, '');
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
