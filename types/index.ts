interface MongoDBRecord {
  _id: string;
}

export namespace Note {
  export interface Model {
    title: string;
    content: string;
    tags?: string[];
  }

  export interface Record extends Model, MongoDBRecord {}

  export interface Response {
    message: string;
    object: Array<Record> | Record;
  }
}

export namespace NotesCategory {
  export interface Model {
    title: string;
    notes: Note.Record[];
  }

  export interface Record extends Model, MongoDBRecord {}

  export interface Response {
    message: string;
    object: Array<Record> | Record;
  }
}