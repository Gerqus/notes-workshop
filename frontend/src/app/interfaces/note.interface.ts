export interface Note {
  name: string;
  id: string;
  subentries?: Note[];
}