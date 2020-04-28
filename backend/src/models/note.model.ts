import * as mongoose from 'mongoose';
import { INoteModel } from 'types';


export interface INoteDocument extends INoteModel, mongoose.Document {}

const NoteSchema = new mongoose.Schema<INoteModel>({
  title: {type: String, required: true, max: 255},
  content: {type: String, required: true},
  tags: {type: Array},
});

export default mongoose.model<INoteDocument>('Note', NoteSchema);
