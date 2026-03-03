import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupervisorDashboardComponent } from './supervisor-dashboard';

describe('Supervisor', () => {
  let component: SupervisorDashboardComponent;
  let fixture: ComponentFixture<SupervisorDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupervisorDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupervisorDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
