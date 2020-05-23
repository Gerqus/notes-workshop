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
        .subscribe((isPressed) => this.handleDragMode(isPressed, key));
    });
  }

  public getCurrentDragMode(): DragModesEnum {
    return this.dragMode.getValue();
  }

  public getRegisteredModifiersKeys(): Keys[] {
    return this.registeredModifiersKeys;
  }

  public subscribe(cb: () => void) {
    return this.dragMode.subscribe(cb);
  }

  public resetDragMode(): void {
    this.dragMode.next(this.defaultDragMode);
  }

  private handleDragMode(isPressed: boolean, key: Keys): void {
    if (isPressed) {
      this.dragMode.next(this.dragModifiersModes[key]);
    } else {
      this.dragMode.next(this.defaultDragMode);
    }
  }
}
