import * as mongoose from 'mongoose';
import { Note } from 'types';


export interface INoteDocument extends Note.Model, mongoose.Document {}

const NoteSchema = new mongoose.Schema<Note.Model>({
  title: {type: String, required: true, max: 255},
  content: {type: String},
  tags: {type: Array},
});

export default mongoose.model<INoteDocument>('Note', NoteSchema);
