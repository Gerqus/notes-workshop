import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ConfigService } from './config.service';

import { joinURLSegments } from '@/utils';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private endpointsUrl: string;

  private getEndpointFor(endpointName: string) {
    if (this.configService.api[endpointName] === undefined) {
      throw new Error(`Endpoint "${endpointName}" is not defined. Add it's url to config.`);
    }
    return this.configService.api.protocol + "://" +
      joinURLSegments(
        this.configService.api.host,
        this.endpointsUrl,
        this.configService.api[endpointName]
      );
  }

  constructor(
    private configService: ConfigService,
    private httpClient: HttpClient
  ) {
    this.endpointsUrl = this.configService.api.root;
  }

  public addNote(): Observable<any> {
    console.log(this.getEndpointFor('note'));
    return this.httpClient.post(
      this.getEndpointFor('note'),
      {}
    )
  }

}

