import { Injectable } from '@angular/core';
import { freezeDeep } from '@/utils';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  public config = {
    "api": {
      "protocol": "http",
      "host": "localhost:6040",
      "root": "api",
      "note": "note"
    },
  }

  constructor() {
    freezeDeep(this);
  }
}