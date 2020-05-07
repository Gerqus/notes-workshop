import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, forkJoin } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { ConfigService } from '../config-service';

import { joinURLSegments } from '@/utils';

import { DataModel, PartialWith } from 'types';

export class GenericApiService<T extends DataModel> {
  private indexedItemsSubject = new Subject<DataModel['Record'][]>();
  private indexedItems: {
    [id in DataModel['Record']['_id']]: DataModel['Record'];
  } = {};
  private endpoint = '';
  private updatingList: boolean;

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

  static logResponse(resp: DataModel['Response']): void {
    console.log('Response from server:', resp.message);
    console.log(resp.object);
  }

  protected _updateEndpointItemsIndex(): void {
    if(this.updatingList) {
      return;
    }
    this.updatingList = true;
    this._fetchAll()
      .subscribe(res => {
        res.forEach(note => {
          this.indexedItems[note._id] = note;
        });
        this.indexedItemsSubject.next(res);
        this.updatingList = false;
      });
  }

  private getEndpoint(pathSegments: string[] = [], getParams: {[K: string]: string} = {}) {
    let output = joinURLSegments(
      this.endpoint,
      ...pathSegments.map(encodeURI)
    );
    if (getParams) {
      output += '?' + Object.entries(getParams).map(entry => entry.join('=')).join('&');
    }
    return output;
  }

  protected _addItem(dataToAdd: T['Model']): Observable<T['Record']> {
    const fullEndpoint = this.getEndpoint();
    console.log('POST', fullEndpoint);
    return this.httpClient.post<T['Response']>(fullEndpoint, dataToAdd)
      .pipe(tap(GenericApiService.logResponse))
      .pipe(tap(() => this._updateEndpointItemsIndex()))
      .pipe(map(noteResp => noteResp.object as T['Record']));
  }

  protected _fetchAll(): Observable<T['Record'][]> {
    const fullEndpoint = this.getEndpoint();
    console.log('GET', fullEndpoint);
    return this.httpClient.get<T['Response']>(fullEndpoint)
      .pipe(tap(GenericApiService.logResponse))
      .pipe(map(noteResp => noteResp.object as T['Record'][]));
  }

  protected _fetchItemById(searchedItemId: T['Record']['_id']): Observable<T['Record']> {
    return new Observable<T['Record']>((subscriber) => {
      if (this.indexedItems[searchedItemId]) {
        setTimeout(() => {
          subscriber.next(this.indexedItems[searchedItemId]);
          subscriber.complete();
        });
      } else {
        this.indexedItemsSubject
          .subscribe(() => {
            setTimeout(() => {
              subscriber.next(this.indexedItems[searchedItemId]);
              subscriber.complete();
            });
          });
          this._updateEndpointItemsIndex();
      }
    });
  }

  protected _fetchItemsQuery(searchedItemQuery: Partial<T['Record']>): Observable<T['Record'][]> {
    const normalizedParams = Object.keys(searchedItemQuery).reduce((accumulator, key) => {
      if (typeof searchedItemQuery[key] !== 'undefined') {
        accumulator[key] = searchedItemQuery[key].toString();
      }
      return accumulator;
    }, {});
    const fullEndpoint = this.getEndpoint([], normalizedParams);
    console.log('GET', fullEndpoint);
    return this.httpClient.get<T['Response']>(fullEndpoint)
      .pipe(tap(GenericApiService.logResponse))
      .pipe(map(noteResp => noteResp.object as T['Record'][]));
  }

  protected _deleteItem(itemId: T['Record']['_id']): Observable<T['Record']> {
    const fullEndpoint = this.getEndpoint([itemId]);
    console.log('DELETE', fullEndpoint);
    return this.httpClient.delete<T['Response']>(fullEndpoint)
      .pipe(tap(GenericApiService.logResponse))
      .pipe(tap(() => this._updateEndpointItemsIndex()))
      .pipe(map(noteResp => noteResp.object as T['Record']));
  }

  protected _updateItem(modifiedItem: PartialWith<T['Record'], '_id'>): Observable<T['Record']> {
    const fullEndpoint = this.getEndpoint([modifiedItem._id]);
    console.log('PATCH', fullEndpoint);
    return this.httpClient.patch<T['Response']>(fullEndpoint, modifiedItem)
      .pipe(tap(GenericApiService.logResponse))
      .pipe(tap(() => this._updateEndpointItemsIndex()))
      .pipe(map(noteResp => noteResp.object as T['Record']));
  }

  protected _updateItems(modifiedItems: PartialWith<T['Record'], '_id'>[]): Observable<T['Record'][]> {
    return forkJoin(modifiedItems.map(modifiedItem => {
      const fullEndpoint = this.getEndpoint([modifiedItem._id]);
      console.log('PATCH', fullEndpoint);
      return this.httpClient.patch<T['Response']>(fullEndpoint, modifiedItem)
        .pipe(tap(GenericApiService.logResponse))
        .pipe(map(noteResp => noteResp.object as T['Record']));
    }))
    .pipe(tap(() => this._updateEndpointItemsIndex()))
  }

  protected _copyItem(itemToBeCopied: PartialWith<T['Record'], '_id'>): Observable<T['Record']> {
    const newItem = Object.assign({}, itemToBeCopied)
    delete newItem._id;
    return this._addItem(newItem);
  }

  protected _getIndexedItemsSubject(): Subject<T['Record'][]> {
    return this.indexedItemsSubject;
  }
}