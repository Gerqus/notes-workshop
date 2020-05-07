import { TestBed } from '@angular/core/testing';

import { DragAndDropModeService } from '.';

describe('DragAndDropModeService', () => {
  let service: DragAndDropModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DragAndDropModeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
