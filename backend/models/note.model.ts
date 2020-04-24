import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

const NoteSchema = new Schema({
    title: {type: String, required: true, max: 100},
    content: {type: Number, required: true},
    tags: {type: Array}
});


// Export the model
export = mongoose.model('Product', NoteSchema);