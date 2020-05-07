import { TestBed } from '@angular/core/testing';

import { BrowseDragServiceService } from './browse-drag-service.service';

describe('BrowseDragServiceService', () => {
  let service: BrowseDragServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BrowseDragServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
