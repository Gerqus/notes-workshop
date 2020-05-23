import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription, iif } from 'rxjs';

export enum Keys {
  'enter' = 'Enter',
  'tab' = 'Tab',
  'ctrl' = 'Control',
  'shift' = 'Shift',
  'f1' = 'F1',
  'f2' = 'F2',
}

export enum Events {
  'keyup' = 'keyup',
  'keydown' = 'keydown',
  'keypress' = 'keypress',
}

interface keyboardEventListener {
  (e: KeyboardEvent): void
}

type listenersTimeTypes = 'before' | 'after';

type EventsListenersIndex = {
  [K in Events]: {
    [K in listenersTimeTypes]: keyboardEventListener[]
  }
}

interface keyboardSubscription {
  isPressed: BehaviorSubject<boolean>,
  listeners: EventsListenersIndex,
}

type KeysGroup<T> = Keys | Keys[] | { [K in Keys]: T };

@Injectable({
  providedIn: 'root'
})
export class InterfaceEventsService {
  private readonly keyEvents: {
    [K in Keys]?: keyboardSubscription
  } = {};
  private readonly shouldPreventDefault: {
    [K in Keys]?: boolean
  } = {};

  private keysList: Keys[];

  constructor() {
    this.keysList = Object.values(Keys);
    this.keysList.forEach(keyName => {
      const listeners: Partial<EventsListenersIndex> = {};
      Object.keys(Events).forEach(eventName => {
        listeners[eventName as Events] = {
          before: [],
          after: [],
        };
      })
      this.keyEvents[keyName] = {
        isPressed: new BehaviorSubject(false),
        listeners: listeners as EventsListenersIndex,
      };
      this.shouldPreventDefault[keyName] = false;
    });

    document.body.addEventListener(Events.keydown, (e) => {
      if (this.isSupported(e)) {
        this.callListenersBefore(e);
        this.keyboardDownListener(e);
        this.callListenersAfter(e);
        return this.preventDefaultCaller(e);
      }
    });
    document.body.addEventListener(Events.keyup, (e) => {
      if (this.isSupported(e)) {
        this.callListenersBefore(e);
        this.keyboardUpListener(e);
        this.callListenersAfter(e);
        return this.preventDefaultCaller(e);
      }
    });
    document.body.addEventListener(Events.keypress, (e) => {
      if (this.isSupported(e)) {
        this.callListenersBefore(e);
        this.keyboardPressListener(e);
        this.callListenersAfter(e);
        return this.preventDefaultCaller(e);
      }
    });
  }

  private keyboardDownListener(e: KeyboardEvent) {
    if (!(this.keyEvents[e.key] as keyboardSubscription).isPressed.getValue()) {
      (this.keyEvents[e.key] as keyboardSubscription).isPressed.next(true);
    }
  }

  private keyboardUpListener(e: KeyboardEvent) {
    if ((this.keyEvents[e.key] as keyboardSubscription).isPressed.getValue()) {
      (this.keyEvents[e.key] as keyboardSubscription).isPressed.next(false);
    }
  }

  private keyboardPressListener(e: KeyboardEvent) {
  }

  private callListenersBefore(e: KeyboardEvent) {
    Object.values(Events).forEach(eventName => {
      (this.keyEvents[e.key] as keyboardSubscription).listeners[eventName]?.before.forEach(listener => listener(e));
    });
  }

  private callListenersAfter(e: KeyboardEvent) {
    Object.values(Events).forEach(eventName => {
      (this.keyEvents[e.key] as keyboardSubscription).listeners[eventName]?.after.forEach(listener => listener(e));
    });
  }

  private isSupported(e: KeyboardEvent) {
    return this.keysList.includes(e.key as Keys);
  }

  private preventDefaultCaller(e: KeyboardEvent) {
    if (this.shouldPreventDefault[e.key]) {
      e.preventDefault();
      return false;
    }
  }

  private executeForEachKey<T>(keyName: KeysGroup<T>, cb: (key: Keys) => void) {
    if (typeof keyName === 'string') {
      cb(keyName);
    } else
    if (Array.isArray(keyName)) {
      keyName.forEach((key) => {
        cb(key);
      });
    } else
    if (typeof keyName === 'object') {
      Object.keys(keyName).forEach((key: Keys) => {
        cb(key);
      })
    }
  }

  public preventDefaultFor(keyName: KeysGroup<boolean>, shouldPrevent: boolean = true) {
    this.executeForEachKey<boolean>(keyName, (key) => {
      this.shouldPreventDefault[key] = keyName[key] || shouldPrevent;
    });
  }

  public subscribeForEvent(keyName: KeysGroup<keyboardEventListener>, eventName: Events, cb: keyboardEventListener, {
    afterStateCallback = false
  }): void {
    this.executeForEachKey<keyboardEventListener>(keyName, (key) => {
      const beforeOfAfterKey: listenersTimeTypes = afterStateCallback ? 'after' : 'before';
      this.keyEvents[key]
        .listeners[eventName][beforeOfAfterKey]
        .push(keyName[key] || cb);
    });
  }

  public getStateSubject(keyName: Keys): BehaviorSubject<boolean> {
    return this.keyEvents[keyName].isPressed;
  }
}
