export * from './enums';
interface MongoDBRecord {
    _id: string;
}
interface IModelDefinitionEntry<T> {
    type: () => T;
    default?: T;
    max?: number;
}
export declare type PartialWith<T, K extends keyof T> = Partial<T> & {
    [key in K]: T[K];
};
export declare type endpointName = string;
export declare type IModelDefinition<T> = {
    [key in keyof T]: T extends Required<Pick<T, key>> ? ({
        required: boolean;
    } | {
        default: T[key];
    }) & IModelDefinitionEntry<T[key]> : IModelDefinitionEntry<T[key]>;
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
        isCategory: boolean;
        isLink: boolean;
        sourceNoteId?: Note['Record']['_id'];
        parentNoteId: Note['Record']['_id'];
    };
    Record: Note['Model'] & MongoDBRecord;
    Response: {
        message: string;
        object: Array<Note['Record']> | Note['Record'];
    };
}
