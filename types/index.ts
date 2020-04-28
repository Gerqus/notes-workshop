interface IRecord {
  _id: string;
}

export interface INoteModel {
  title: string;
  content: string;
  tags?: string[];
}

export interface INoteRecord extends INoteModel, IRecord {}

export interface INoteResponse {
  message: string;
  object: Array<INoteRecord>;
}
