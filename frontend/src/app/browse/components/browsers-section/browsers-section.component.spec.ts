import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowsersSectionComponent } from './browsers-section.component';

describe('BrowsersSectionComponent', () => {
  let component: BrowsersSectionComponent;
  let fixture: ComponentFixture<BrowsersSectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BrowsersSectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BrowsersSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
