import * as mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  title: {type: String, required: true, max: 100},
  content: {type: Number, required: true},
  tags: {type: Array},
});

export = mongoose.model('Product', NoteSchema);
