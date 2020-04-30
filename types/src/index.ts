
import * as mongoose from 'mongoose';

export * from './enums';

interface MongoDBRecord {
  _id: string;
}

export type endpointName = string;

export type IModelDefinition<T> = {
  [key in keyof T]: mongoose.SchemaTypeOpts<() => T[key]>;
};

export interface DataModel {
  Model: {};
  Record: DataModel['Model'] & MongoDBRecord;
  Response: {
    message: string;
    object: Array<DataModel['Record']> | DataModel['Record'];
  };
}

export interface Note extends DataModel {
  Model: {
    title: string;
    content: string;
    tags?: string[];
  }

  Record: Note['Model'] & MongoDBRecord;

  Response: {
    message: string;
    object: Array<Note['Record']> | Note['Record'];
  }
}

export interface NotesCategory extends DataModel {
  Model: {
    title: string;
    notes: Array<NotesCategory['Record']>;
  }

  Record: NotesCategory['Model'] & MongoDBRecord;

  Response: {
    message: string;
    object: Array<NotesCategory['Record']> | NotesCategory['Record'];
  }
}
