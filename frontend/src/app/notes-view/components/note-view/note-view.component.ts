import { Component, ViewChild, Input } from '@angular/core';

import { Note } from 'types';

import { NotesControllerService } from '@/services/notes-controller';
import { NoteIndexRecord } from '@/services/notes-controller/note-index-record.class';

@Component({
  selector: 'app-note-view',
  templateUrl: './note-view.component.html',
  styleUrls: ['./note-view.component.less']
})
export class NoteViewComponent {
  @ViewChild('noteTitle') noteTitleElement: {nativeElement: HTMLDivElement};
  @ViewChild('noteContent') noteContentElement: {nativeElement: HTMLDivElement};
  @Input('note') note: NoteIndexRecord;

  constructor(
    private notesControllerService: NotesControllerService,
  ) { }

  public saveNote() {
    const titleToSave = this.noteTitleElement.nativeElement.innerHTML.replace(/<br\/?>$/, '');
    const contentToSave = this.noteContentElement.nativeElement.innerHTML.replace(/<br\/?>$/, '');
    this.notesControllerService.saveNote(this.note._id, titleToSave, contentToSave);
  }

  public deleteNote() {
    this.notesControllerService.deleteNote(this.note);
  }

  public toggleCategory() {
    this.notesControllerService.toggleCategory(this.note);
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
