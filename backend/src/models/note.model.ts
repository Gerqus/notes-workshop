import * as mongoose from 'mongoose';
import { Note, IModelDefinition } from 'types';


export interface INoteDocument extends Note.Model, mongoose.Document {}

const noteSchema: IModelDefinition<Note.Model> = {
  title: {type: String, required: true, max: 255},
  content: {type: String},
  tags: {type: Array},
};

const NoteSchema = new mongoose.Schema<Note.Model>(noteSchema);

export default mongoose.model<INoteDocument>('Note', NoteSchema);
