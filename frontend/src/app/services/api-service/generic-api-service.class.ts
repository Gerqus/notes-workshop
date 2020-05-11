import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, forkJoin } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { ConfigService } from '../config-service';

import { joinURLSegments } from '@/utils';

import { DataModel, PartialWith } from 'types';

export class GenericApiService<T extends DataModel> {
  private endpoint = '';

  constructor(
    protected configService: ConfigService,
    protected httpClient: HttpClient,
    protected apiRootEndpoint: string,
    protected endpointName: string,
  ) {
    if (this.configService.api[this.endpointName] === undefined) {
      throw new Error(`Endpoint "${this.endpointName}" is not defined in config. Add it's url to config.`);
    }

    this.endpoint = this.configService.api.protocol +
      "://" +
      joinURLSegments(
        this.configService.api.host,
        this.apiRootEndpoint,
        this.configService.api[this.endpointName]
      );
  }

  private getEndpoint(pathSegments: string[] = [], getParams: {[K: string]: string} = {}) {
    let output = joinURLSegments(
      this.endpoint,
      ...pathSegments.map(encodeURI)
    );
    if (Object.keys(getParams).length) {
      output += '?' + Object.entries(getParams).map(entry => entry.join('=')).join('&');
    }
    return output;
  }

  // below usage of Partial<> is not proper... I should have separate definition than Record and Model, that will tell what is mandatory, and what has defaultvalues (or is optional)
  protected _addItem(dataToAdd: Partial<T['Model']>): Observable<T['Record']> {
    const fullEndpoint = this.getEndpoint();
    return this.httpClient.post<T['Response']>(fullEndpoint, dataToAdd)
      .pipe(map(noteResp => noteResp.object as T['Record']));
  }

  protected _fetchItemById(searchedItemId: T['Record']['_id']): Observable<T['Record']> {
    return this._fetchItemsQuery({_id: searchedItemId})
      .pipe(map((foundItems) => {
        return foundItems[0];
      }));
  }

  protected _fetchItemsQuery(searchedItemQuery: Partial<T['Record']>): Observable<T['Record'][]> {
    const normalizedParams = this.formatParameters(searchedItemQuery);
    const fullEndpoint = this.getEndpoint([], normalizedParams);
    return this.httpClient.get<T['Response']>(fullEndpoint)
      .pipe(map(noteResp => noteResp.object as T['Record'][]));
  }

  private formatParameters(searchQuery: Partial<T['Record']>) {
    return Object.keys(searchQuery).reduce((accumulator, key) => {
      if (typeof searchQuery[key] !== 'undefined') {
        if (searchQuery[key] === null) {
          accumulator[key] = searchQuery[key];
        } else {
          accumulator[key] = searchQuery[key].toString();
        }
      }
      return accumulator;
    }, {});
  }

  protected _deleteItem(item: T['Record']): Observable<null> {
    const fullEndpoint = this.getEndpoint([item._id]);
    return this.httpClient.delete<T['Response']>(fullEndpoint)
      .pipe(map(noteResp => noteResp.object as null));
  }

  protected _updateItem(modifiedItem: PartialWith<T['Record'], '_id'>): Observable<T['Record']> {
    const fullEndpoint = this.getEndpoint([modifiedItem._id]);
    return this.httpClient.patch<T['Response']>(fullEndpoint, modifiedItem)
      .pipe(map(noteResp => noteResp.object as T['Record']));
  }

  protected _copyItem(itemToBeCopied: PartialWith<T['Record'], '_id'>): Observable<T['Record']> {
    const newItem = {
      ...itemToBeCopied
    };
    delete newItem._id;
    return this._addItem(newItem);
  }
}