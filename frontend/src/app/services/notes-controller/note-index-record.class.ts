import { BehaviorSubject } from 'rxjs';
import { Note } from 'types';

type NoteRecord = Note['Record']; // hack needed due to typescript syntax restirctions

export class NoteIndexRecord implements Required<NoteRecord> {
  public childNotes = new BehaviorSubject<NoteIndexRecord[]>([]);
  public linkNotes?: NoteIndexRecord[] = [];

  constructor(
    private actualNote: Note['Record'],
    public sourceNote: NoteIndexRecord | null,
    public parentNote: NoteIndexRecord,
    linkNotes?: NoteIndexRecord[],
    childNotes?: NoteIndexRecord[],
  ) {
    if(childNotes) { this.childNotes.next(childNotes) }
    if(linkNotes) { this.linkNotes = linkNotes }
  }

  get isLink() {
    return this.actualNote.isLink;
  }
  set isLink(newFlagValue) {
    this.actualNote.isLink = newFlagValue;
  }

  get parentNoteId() {
    return this.actualNote.parentNoteId;
  }
  set parentNoteId(parentNoteId) {
    this.actualNote.parentNoteId = parentNoteId;
  }

  get _id() {
    return this.actualNote._id;
  }
  set _id(_id) {
    this.actualNote._id = _id;
  }

  get contentSourceId() {
    return this._linkGetter('_id');
  }
  set contentSourceId(_id) {
    this._linkSetter('_id', _id)
  }

  get sourceNoteId() {
    return this.actualNote.sourceNoteId;
  }
  set sourceNoteId(_id) {
    this.actualNote.sourceNoteId = _id;
  }

  get title() {
    return this._linkGetter('title');
  }
  set title(newTitle) {
    this._linkSetter('title', newTitle)
  }

  get content() {
    return this._linkGetter('content');
  }
  set content(newContent) {
    this._linkSetter('content', newContent)
  }

  get isCategory() {
    return this._linkGetter('isCategory');
  }
  set isCategory(newFlagValue) {
    this._linkSetter('isCategory', newFlagValue)
  }

  private _linkGetter<K extends keyof NoteRecord>(propertyName: K) {
    if (this.actualNote.isLink) {
      return (this.sourceNote as NoteRecord)[propertyName];
    } else {
      return this.actualNote[propertyName];
    }
  }

  private _linkSetter<K extends keyof NoteRecord>(propertyName: K, newValue: NoteRecord[K]) {
    if (this.actualNote.isLink) {
      (this.sourceNote as NoteRecord)[propertyName] = newValue;
    } else {
      this.actualNote[propertyName] = newValue;
    }
  }
}