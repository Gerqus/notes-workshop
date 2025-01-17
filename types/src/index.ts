export * from './enums';

interface MongoDBRecord {
  _id: string;
}

interface IModelDefinitionEntry<T> {
  type: () => T;
  default?: (() => T) | T;
  max?: number;
}

export type PartialWith<T, K extends keyof T> = Partial<T> & {[key in K]: T[K]};

export type endpointName = string;

export type IModelDefinition<T> = {
  [key in keyof T]:
    T extends Required<Pick<T, key>>
    ?
      ({ required: boolean } | { default: (() => T[key]) | T[key] }) &
      IModelDefinitionEntry<T[key]>
    :
      IModelDefinitionEntry<T[key]>
};

export interface DataModel {
  Model: {};
  Record: DataModel['Model'] & MongoDBRecord;
  Response: {
    message: string;
    object: Array<DataModel['Record']> | DataModel['Record'] | null;
  };
}

export interface Note extends DataModel {
  Model: {
    title: string;
    content: string;
    isCategory: boolean; // jeżeli notatka traktowana jest jako kategoria, to używamy jej tytułu, ale ignorujemy treść i wyświetlamy tytuł pogrubiony,w iększy itd...
    isLink: boolean; // jeżeli notatka traktowana jest jako link, to ignorujemy wszystkie jej parametry poza parentNoteId, originalNoteId opraz isLink a resztę uzupełniamy z oryginału
    sourceNoteId?: Note['Record']['_id'];
    parentNoteId: Note['Record']['_id'];
    index: number;
  }

  Record: Note['Model'] & MongoDBRecord;

  Response: {
    message: string;
    object: Array<Note['Record']> | Note['Record'];
  }
}
