import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DraggableNoteEntryComponent } from './draggable-note-entry.component';

describe('DraggableNoteEntryComponent', () => {
  let component: DraggableNoteEntryComponent;
  let fixture: ComponentFixture<DraggableNoteEntryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DraggableNoteEntryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DraggableNoteEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
