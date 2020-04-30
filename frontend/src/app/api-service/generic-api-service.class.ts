import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { ConfigService } from '../config.service';

import { joinURLSegments } from '@/utils';

import { DataModel } from 'types';

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

  static logResponse(resp: DataModel['Response']) {
    console.log('Response from server:', resp.message);
  }

  protected _updateEndpointItemsIndex(): void {
    console.time('notes list fetching');
    if(this.updatingList) {
      return;
    }
    this.updatingList = true;
    this._fetchAll()
      .subscribe(res => {
        console.timeStamp('in subscription');
        res.forEach(note => {
          this.indexedItems[note._id] = note;
        });
        console.timeStamp('after indexing');
        this.indexedItemsSubject.next(res);
        this.updatingList = false;
        console.timeStamp('after calling next');
        console.timeEnd('notes list fetching');
      });
  }

  private getEndpoint(...params: string[]) {
    return joinURLSegments(
        this.endpoint,
        ...params.map(encodeURI)
      );
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

  protected async _fetchItemById(searchedItemId: T['Record']['_id']): Promise<T['Record']> {
    // TODO: przerobić tak, żeby funckja zwracała observable
    return new Promise((resolve) => {
      if (this.indexedItems[searchedItemId]) {
        resolve(this.indexedItems[searchedItemId]);
      } else {
        this.indexedItemsSubject
          .subscribe(() => {
            resolve(this.indexedItems[searchedItemId])
          });
          this._updateEndpointItemsIndex();
      }
    })
  }

  protected _deleteItem(itemId: T['Record']['_id']): Observable<T['Record']> {
    const fullEndpoint = this.getEndpoint(itemId);
    console.log('DELETE', fullEndpoint);
    return this.httpClient.delete<T['Response']>(fullEndpoint)
      .pipe(tap(GenericApiService.logResponse))
      .pipe(tap(() => this._updateEndpointItemsIndex()))
      .pipe(map(noteResp => noteResp.object as T['Record']));
  }

  protected _updateItem(modifiedItem: T['Record']): Observable<T['Record']> {
    const fullEndpoint = this.getEndpoint(modifiedItem._id);
    console.log('PATCH', fullEndpoint);
    // if (!noteToSave.title) {
    //   throw new Error('Note must have a title. Aborting note saving.');
    // }
    return this.httpClient.patch<T['Response']>(fullEndpoint, modifiedItem)
      .pipe(tap(GenericApiService.logResponse))
      .pipe(tap(() => this._updateEndpointItemsIndex()))
      .pipe(map(noteResp => noteResp.object as T['Record']));
  }

  protected _getIndexedItemsSubject(): Subject<T['Record'][]> {
    return this.indexedItemsSubject;
  }
}