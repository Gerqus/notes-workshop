"use strict";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var NoteSchema = new Schema({
    title: { type: String, required: true, max: 100 },
    content: { type: Number, required: true },
    tags: { type: Array }
});
module.exports = mongoose.model('Product', NoteSchema);
