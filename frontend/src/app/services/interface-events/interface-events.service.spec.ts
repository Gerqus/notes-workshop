import { TestBed } from '@angular/core/testing';

import { InterfaceEventsService } from '.';

describe('InterfaceEventsService', () => {
  let service: InterfaceEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InterfaceEventsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
