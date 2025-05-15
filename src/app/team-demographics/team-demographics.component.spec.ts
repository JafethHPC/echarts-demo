import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamDemographicsComponent } from './team-demographics.component';

describe('TeamDemographicsComponent', () => {
  let component: TeamDemographicsComponent;
  let fixture: ComponentFixture<TeamDemographicsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamDemographicsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamDemographicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
