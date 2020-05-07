import { TestBed } from '@angular/core/testing';

import { DropCheckerService } from './drop-checker.service';

describe('DropCheckerService', () => {
  let service: DropCheckerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DropCheckerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
