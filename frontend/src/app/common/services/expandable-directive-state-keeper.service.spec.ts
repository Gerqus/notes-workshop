import { TestBed } from '@angular/core/testing';

import { ExpandableDirectiveStateKeeperService } from './expandable-directive-state-keeper.service';

describe('ExpandableDirectiveStateKeeperService', () => {
  let service: ExpandableDirectiveStateKeeperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExpandableDirectiveStateKeeperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
