import { BehaviorSubject } from 'rxjs';
import { Note } from 'types';

type NoteRecord = Note['Record']; // hack needed due to typescript syntax restirctions

export class NoteIndexRecord implements Required<NoteRecord> {
  public readonly childNotesIds = new BehaviorSubject<Note['Record']['_id'][]>([]);
  public readonly linkNotesIds?: Note['Record']['_id'][];

  constructor(
    public readonly actualNote: Note['Record'],
    linkNotesIds?: Note['Record']['_id'][],
    childNotesIds?: Note['Record']['_id'][],
  ) {
    if (childNotesIds && childNotesIds.length) { this.childNotesIds.next(childNotesIds) }
    this.linkNotesIds = linkNotesIds || [];
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

  get sourceNoteId() {
    return this.actualNote.sourceNoteId;
  }
  set sourceNoteId(_id) {
    this.actualNote.sourceNoteId = _id;
  }

  get title() {
    return this.actualNote.title;
  }
  set title(newTitle) {
    this.actualNote.title = newTitle;
  }

  get content() {
    return this.actualNote.content;
  }
  set content(newContent) {
    this.actualNote.content = newContent;
  }

  get isCategory() {
    return this.actualNote.isCategory;
  }
  set isCategory(newFlagValue) {
    this.actualNote.isCategory = newFlagValue;
  }

  get index() {
    return this.actualNote.index;
  }
  set index(newIndex) {
    this.actualNote.index = newIndex;
  }
}