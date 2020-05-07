import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from '@/services/api-service';

@Injectable({
  providedIn: 'root'
})
export class ExpandableDirectiveStateKeeperService {
  private statesSubscriptions: {
    [K: string]: BehaviorSubject<boolean>
  } = {};

  constructor(
    private apiService: ApiService
  ) {
    (window as any).statesSubscriptions = this.statesSubscriptions;
  }

  public setState(elementId: string, isExpanded: boolean): void {
    if (elementId === this.apiService.note.topNotesParentKey) {
      return;
    }
    if (!this.statesSubscriptions[elementId]) {
      throw new Error('Subscription for element ' + elementId + ' does not exist. Need to subscribe before setting new value');
    }
    this.statesSubscriptions[elementId].next(isExpanded);
  }

  public getStateSubject(elementId: string): BehaviorSubject<boolean> {
    if (!this.statesSubscriptions[elementId]) {
      this.statesSubscriptions[elementId] = new BehaviorSubject(false);
    }
    return this.statesSubscriptions[elementId];
  }

  public toggleState(elementId: string) {
    if(this.statesSubscriptions[elementId].getValue()) {
      this.setState(elementId, false);
    } else {
      this.setState(elementId, true);
    }
  }
}
