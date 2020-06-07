import { TestBed } from '@angular/core/testing';

import { PanesControllerService } from './panes-controller.service';

describe('PanesControllerService', () => {
  let service: PanesControllerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PanesControllerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
