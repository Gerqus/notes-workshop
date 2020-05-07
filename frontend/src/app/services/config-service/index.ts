import { Injectable } from '@angular/core';
import config from '@/../assets/config.json';
import { freezeDeep } from '@/utils';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  public api: {
    protocol: string,
    host: string,
    root: string,
    note: string
  };

  constructor() {
    Object.keys(config).forEach(key => {
      this[key] = config[key];
    });
    freezeDeep(this);
  }
}