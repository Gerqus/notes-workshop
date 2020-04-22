import { ENTRIES_TYPES } from '../enums';

export interface BrowserEntry {
  type: ENTRIES_TYPES;
  name: string;
  id: string;
  subentries?: BrowserEntry[];
}
