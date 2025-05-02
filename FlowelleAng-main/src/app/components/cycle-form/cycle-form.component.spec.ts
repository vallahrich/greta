import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CycleentryComponent } from './cycle-form.component';

describe('CycleentryComponent', () => {
  let component: CycleentryComponent;
  let fixture: ComponentFixture<CycleentryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CycleentryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CycleentryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
