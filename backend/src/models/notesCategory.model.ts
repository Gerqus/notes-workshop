import * as mongoose from 'mongoose';
import { NotesCategory, IModelDefinition } from 'types';


export interface INotesCategoryDocument extends NotesCategory.Model, mongoose.Document {}

const notesCategorySchema: IModelDefinition<NotesCategory.Model> = {
  title: {type: String, required: true, max: 255},
  notes: {type: Array},
};

const NotesCategorySchema = new mongoose.Schema<NotesCategory.Model>(notesCategorySchema);
export default mongoose.model<INotesCategoryDocument>('Note', NotesCategorySchema);
