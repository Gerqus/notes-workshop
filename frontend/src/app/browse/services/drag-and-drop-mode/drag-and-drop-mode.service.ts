import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Keys, InterfaceEventsService } from '@/services/interface-events';
import { DragModesEnum } from '../../enums/dragModes.enum';

@Injectable({
  providedIn: 'root'
})
export class DragAndDropModeService {
  private readonly defaultDragMode = DragModesEnum.move;
  private readonly dragMode = new BehaviorSubject(this.defaultDragMode);
  private dragModifiersModes = {
    [Keys.f1]: DragModesEnum.copy,
    [Keys.f2]: DragModesEnum.link,
  }
  private registeredModifiersKeys: Keys[]; // will be populated with keys of #dragModifiersModes in constructor

  constructor(
    private interfaceEventsService: InterfaceEventsService,
  ) {
    this.registeredModifiersKeys = Object.keys(this.dragModifiersModes) as Keys[];
    this.registeredModifiersKeys.forEach(key => {
      this.interfaceEventsService.getStateSubject(key)
        .subscribe(this.handleDragMode.bind(this));
    });
  }

  public getCurrentDragMode() {
    return this.dragMode.getValue();
  }

  public getRegisteredModifiersKeys() {
    return this.registeredModifiersKeys;
  }

  public subscribe(cb: () => void) {
    return this.dragMode
      .subscribe(cb);
  }

  public resetDragMode() {
    this.dragMode.next(this.defaultDragMode);
  }

  private handleDragMode() {
    let keysCount = 0;
    let matchedKey = '';
    this.registeredModifiersKeys.forEach(key => {
      if (this.interfaceEventsService.getStateSubject(key).getValue()) {
        ++keysCount;
        matchedKey = key;
      }
    });
    if (keysCount === 1) {
      this.dragMode.next(this.dragModifiersModes[matchedKey]);
    } else {
      this.dragMode.next(this.defaultDragMode);
    }
  }
}
