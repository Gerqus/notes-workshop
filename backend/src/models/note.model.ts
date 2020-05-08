import * as mongoose from 'mongoose';
import { Note, IModelDefinition } from 'types';

type NoteModel = Note['Model']; // hack... maybe they'll solve it in typescript in some time
export interface INoteDocument extends NoteModel, mongoose.Document {}

const noteSchema: IModelDefinition<Note['Model']> = {
  title: {type: String, default: 'New note', max: 255},
  content: {type: String, default: ''},
  isCategory: {type: Boolean, default: false},
  isLink: {type: Boolean, default: false},
  originalNoteId: {type: String},
  parentNoteId: {type: String, default: 'top'},
};

const NoteSchema = new mongoose.Schema<Note['Model']>(noteSchema);

export default mongoose.model<INoteDocument>('Note', NoteSchema);
