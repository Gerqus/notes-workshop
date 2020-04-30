import * as mongoose from 'mongoose';
import { NotesCategory, IModelDefinition } from 'types';

type NoteCategoryModel = NotesCategory['Model']; // hack... maybe they'll solve it in typescript in some time
export interface INotesCategoryDocument extends NoteCategoryModel, mongoose.Document {}

const notesCategorySchema: IModelDefinition<NotesCategory['Model']> = {
  title: {type: String, required: true, max: 255},
  notes: {type: Array},
};

const NotesCategorySchema = new mongoose.Schema<NotesCategory['Model']>(notesCategorySchema);
export default mongoose.model<INotesCategoryDocument>('Note', NotesCategorySchema);
