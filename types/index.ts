export interface INoteModel {
  title: string;
  content: string;
  tags?: string[];
}

export interface INoteRecord extends INoteModel {
  _id: string;
}

export interface INoteResponse {
  message: string;
  object: Array<INoteRecord>;
}
