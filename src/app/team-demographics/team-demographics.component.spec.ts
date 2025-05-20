import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeamDemographicsComponent } from './team-demographics.component';
import { TeamDemographicsService } from './team-demographics.service';
import { LocationCacheService } from './services/location-cache.service';
import { of } from 'rxjs';

describe('TeamDemographicsComponent', () => {
  let component: TeamDemographicsComponent;
  let fixture: ComponentFixture<TeamDemographicsComponent>;
  let teamDemographicsServiceMock: any;
  let locationCacheServiceMock: any;

  beforeEach(async () => {
    // Create mock services
    teamDemographicsServiceMock = {
      getTeamMembersWithCoordinates: jest.fn().mockReturnValue(
        of([
          {
            id: '1',
            name: 'John Doe',
            role: 'Software Engineer',
            hrManager: 'Manager 1',
            city: 'New York',
            state: 'NY',
            country: 'United States',
            timeZone: 'GMT-5',
            coordinates: [74.006, 40.7128],
          },
        ])
      ),
    };

    locationCacheServiceMock = {
      getCoordinates: jest.fn(),
      cacheCoordinates: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [],
      declarations: [TeamDemographicsComponent],
      providers: [
        {
          provide: TeamDemographicsService,
          useValue: teamDemographicsServiceMock,
        },
        { provide: LocationCacheService, useValue: locationCacheServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamDemographicsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load team members on init', () => {
    // Act
    fixture.detectChanges(); // This will trigger ngOnInit

    // Assert
    expect(
      teamDemographicsServiceMock.getTeamMembersWithCoordinates
    ).toHaveBeenCalled();
    expect(component.teammates.length).toBe(1);
    expect(component.teammates[0].name).toBe('John Doe');
  });

  it('should calculate team statistics correctly', () => {
    // Setup
    component.teammates = [
      {
        id: '1',
        name: 'John',
        role: 'Software Engineer',
        country: 'US',
        state: 'NY',
      },
      {
        id: '2',
        name: 'Jane',
        role: 'QA Specialist',
        country: 'US',
        state: 'CA',
      },
      { id: '3', name: 'Bob', role: 'Scrum Master', country: 'UK', state: '' },
    ] as any[];

    // Assert
    expect(component.teamSize).toBe(3);
    expect(component.uniqueLocations).toBe(3);
    expect(component.numSoftwareEngineers).toBe(1);
    expect(component.numQualitySpecialists).toBe(1);
    expect(component.numScrumMasters).toBe(1);
  });
});
