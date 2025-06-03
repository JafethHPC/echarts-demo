import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { of, throwError } from 'rxjs';
import { TeamDemographicsComponent } from './team-demographics.component';
import { TeamDemographicsService } from './team-demographics.service';
import { TeamMember } from './models/location.model';

// Mock ECharts
jest.mock('echarts', () => ({
  registerMap: jest.fn(),
  init: jest.fn(() => ({
    setOption: jest.fn(),
    on: jest.fn(),
    getOption: jest.fn(() => ({
      geo: [{ zoom: 2.5 }],
    })),
    dispose: jest.fn(),
  })),
}));

describe('TeamDemographicsComponent', () => {
  let component: TeamDemographicsComponent;
  let fixture: ComponentFixture<TeamDemographicsComponent>;
  let teamDemographicsServiceMock: jest.Mocked<TeamDemographicsService>;

  const mockTeamMembers: (TeamMember & { coordinates?: [number, number] })[] = [
    {
      id: 1,
      name: 'John Doe',
      role: 'Software Engineer',
      profilePic: 'pic1.jpg',
      city: 'New York',
      state: 'NY',
      country: 'United States',
      locationId: 1,
      hrManager: 'Manager 1',
      timeZone: 'EST',
      coordinates: [-74.006, 40.7128],
    },
    {
      id: 2,
      name: 'Jane Smith',
      role: 'Quality Specialist',
      profilePic: 'pic2.jpg',
      city: 'Los Angeles',
      state: 'CA',
      country: 'United States',
      locationId: 2,
      hrManager: 'Manager 2',
      timeZone: 'PST',
      coordinates: [-118.2437, 34.0522],
    },
    {
      id: 3,
      name: 'Bob Johnson',
      role: 'Scrum Master',
      profilePic: 'pic3.jpg',
      city: 'London',
      state: '',
      country: 'United Kingdom',
      locationId: 3,
      hrManager: 'Manager 3',
      timeZone: 'GMT',
      coordinates: [-0.1278, 51.5074],
    },
    {
      id: 4,
      name: 'Alice Brown',
      role: 'Product Owner',
      profilePic: 'pic4.jpg',
      city: 'Charlotte',
      state: 'NC',
      country: 'United States',
      locationId: 4,
      hrManager: 'Manager 4',
      timeZone: 'EST',
      coordinates: [-80.8431, 35.2271],
    },
    {
      id: 5,
      name: 'Charlie Wilson',
      role: 'Data Engineer',
      profilePic: 'pic5.jpg',
      city: 'Austin',
      state: 'TX',
      country: 'United States',
      locationId: 5,
      hrManager: 'Manager 5',
      timeZone: 'CST',
      coordinates: [-97.7431, 30.2672],
    },
  ];

  beforeEach(async () => {
    teamDemographicsServiceMock = {
      getTeamDemographicsData: jest.fn().mockReturnValue(of(mockTeamMembers)),
      getTeamMembersWithCoordinates: jest
        .fn()
        .mockReturnValue(of(mockTeamMembers)),
    } as any;

    await TestBed.configureTestingModule({
      declarations: [TeamDemographicsComponent],
      imports: [
        FormsModule,
        NgxEchartsModule.forRoot({ echarts: () => import('echarts') }),
      ],
      providers: [
        {
          provide: TeamDemographicsService,
          useValue: teamDemographicsServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamDemographicsComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.teammates).toEqual([]);
      expect(component.selectedTeammates).toEqual([]);
      expect(component.selectedLocation).toBe('');
      expect(component.isTableVisible).toBe(false);
      expect(component.searchTerm).toBe('');
      expect(component.sortColumn).toBe('');
      expect(component.sortDirection).toBe('asc');
      expect(component.pageSize).toBe(5);
      expect(component.currentPage).toBe(1);
      expect(component.totalPages).toBe(1);
      expect(component.isLoadingData).toBe(false);
    });

    it('should load team members on init', () => {
      fixture.detectChanges();

      expect(
        teamDemographicsServiceMock.getTeamMembersWithCoordinates
      ).toHaveBeenCalled();
      expect(component.teammates).toEqual(mockTeamMembers);
      expect(component.isLoadingData).toBe(false);
    });

    it('should handle service error on init', () => {
      teamDemographicsServiceMock.getTeamMembersWithCoordinates.mockReturnValue(
        throwError('Service error')
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      fixture.detectChanges();

      expect(component.isLoadingData).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading team members:',
        'Service error'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Statistics Calculations', () => {
    beforeEach(() => {
      component.teammates = mockTeamMembers;
    });

    it('should calculate team size correctly', () => {
      expect(component.teamSize).toBe(5);
    });

    it('should calculate unique locations correctly', () => {
      expect(component.uniqueLocations).toBe(5); // NY, CA, UK, NC, TX
    });

    it('should calculate software engineers correctly', () => {
      expect(component.numSoftwareEngineers).toBe(2); // Software Engineer + Data Engineer
    });

    it('should calculate quality specialists correctly', () => {
      expect(component.numQualitySpecialists).toBe(1);
    });

    it('should calculate scrum masters correctly', () => {
      expect(component.numScrumMasters).toBe(1);
    });

    it('should calculate product owners correctly', () => {
      expect(component.numProductOwners).toBe(1);
    });

    it('should calculate app control specialists correctly', () => {
      expect(component.numAppControlSpecialists).toBe(0);
    });
  });

  describe('Table Functionality', () => {
    beforeEach(() => {
      component.teammates = mockTeamMembers;
      component.selectedTeammates = mockTeamMembers.slice(0, 3);
    });

    it('should filter teammates by search term', () => {
      component.searchTerm = 'john';
      const filtered = component.filteredTeammates;
      expect(filtered.length).toBe(2); // John Doe and Bob Johnson
    });

    it('should filter teammates by role', () => {
      component.searchTerm = 'engineer';
      const filtered = component.filteredTeammates;
      expect(filtered.length).toBe(1); // Only Software Engineer (Data Engineer is in different test data)
    });

    it('should sort teammates by name ascending', () => {
      component.sortBy('name');
      const filtered = component.filteredTeammates;
      expect(filtered[0].name).toBe('Bob Johnson'); // First alphabetically from the 3 selected teammates
      expect(component.sortColumn).toBe('name');
      expect(component.sortDirection).toBe('asc');
    });

    it('should sort teammates by name descending when clicked twice', () => {
      component.sortBy('name');
      component.sortBy('name');
      const filtered = component.filteredTeammates;
      expect(filtered[0].name).toBe('John Doe'); // Last alphabetically from the 3 selected teammates
      expect(component.sortDirection).toBe('desc');
    });

    it('should paginate teammates correctly', () => {
      component.pageSize = 2;
      component.currentPage = 1;
      const paginated = component.paginatedTeammates;
      expect(paginated.length).toBe(2);
      expect(component.totalPages).toBe(2); // 3 teammates / 2 per page = 2 pages
    });

    it('should change page correctly', () => {
      component.totalPages = 3;
      component.changePage(2);
      expect(component.currentPage).toBe(2);
    });

    it('should not change to invalid page', () => {
      component.totalPages = 3;
      component.currentPage = 2;
      component.changePage(5);
      expect(component.currentPage).toBe(2);
    });

    it('should generate page numbers correctly', () => {
      component.selectedTeammates = mockTeamMembers;
      component.pageSize = 2;
      // Need to trigger the getter to calculate totalPages
      const paginated = component.paginatedTeammates;
      const pageNumbers = component.pageNumbers;
      expect(pageNumbers).toEqual([1, 2, 3]); // 5 teammates / 2 per page = 3 pages
    });

    it('should close table', () => {
      component.isTableVisible = true;
      component.selectedTeammates = mockTeamMembers;
      component.selectedLocation = 'Test Location';

      component.closeTable();

      expect(component.isTableVisible).toBe(false);
      expect(component.selectedTeammates).toEqual([]);
      expect(component.selectedLocation).toBe('');
    });

    it('should get sort indicator correctly', () => {
      expect(component.getSortIndicator('name')).toBe('↕');

      component.sortColumn = 'name';
      component.sortDirection = 'asc';
      expect(component.getSortIndicator('name')).toBe('↑');

      component.sortDirection = 'desc';
      expect(component.getSortIndicator('name')).toBe('↓');
    });

    it('should reset to first page when sorting', () => {
      component.currentPage = 3;
      component.sortBy('name');
      expect(component.currentPage).toBe(1);
    });

    it('should handle search with special characters', () => {
      component.searchTerm = 'doe';
      const filtered = component.filteredTeammates;
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('John Doe');
    });

    it('should handle empty search term', () => {
      component.searchTerm = '';
      const filtered = component.filteredTeammates;
      expect(filtered.length).toBe(3); // All selected teammates
    });
  });

  describe('Chart Functionality', () => {
    beforeEach(() => {
      component.teammates = mockTeamMembers;
      fixture.detectChanges();
    });

    it('should handle chart initialization', () => {
      const mockChart = {
        on: jest.fn(),
        getOption: jest.fn(() => ({ geo: [{ zoom: 2.5 }] })),
        setOption: jest.fn(),
      };

      component.onChartInit(mockChart);

      expect(component.chart).toBe(mockChart);
      expect(mockChart.on).toHaveBeenCalledWith(
        'georoam',
        expect.any(Function)
      );
    });

    it('should handle chart click for country level', () => {
      const event = {
        data: {
          id: 'country-uk',
          level: 'country',
          name: 'United Kingdom',
          country: 'United Kingdom',
        },
      };

      component.onChartClick(event);

      expect(component.selectedLocation).toBe('United Kingdom');
      expect(component.selectedTeammates.length).toBe(1);
      expect(component.isTableVisible).toBe(true);
    });

    it('should handle chart click for state level', () => {
      const event = {
        data: {
          id: 'US-NY',
          level: 'state',
          name: 'New York',
          state: 'NY',
        },
      };

      component.onChartClick(event);

      expect(component.selectedLocation).toBe('New York, USA');
      expect(component.selectedTeammates.length).toBe(1);
      expect(component.isTableVisible).toBe(true);
    });

    it('should handle chart click for city level', () => {
      const event = {
        data: {
          id: 1,
          level: 'city',
          city: 'New York',
          country: 'United States',
        },
      };

      component.onChartClick(event);

      expect(component.selectedLocation).toBe('New York, United States');
      expect(component.selectedTeammates.length).toBe(1);
      expect(component.isTableVisible).toBe(true);
    });

    it('should handle chart click with coordinates fallback', () => {
      const event = {
        data: {
          id: 999,
          level: 'city',
          city: 'Test City',
          country: 'Test Country',
          coordinates: [-74.006, 40.7128],
        },
      };

      component.onChartClick(event);

      expect(component.selectedLocation).toBe('Test City, Test Country');
      expect(component.selectedTeammates.length).toBe(1); // Should find John Doe by coordinates
    });

    it('should not handle chart click without data', () => {
      const event = {};
      component.onChartClick(event);
      expect(component.isTableVisible).toBe(false);
    });
  });

  describe('Private Methods', () => {
    beforeEach(() => {
      component.teammates = mockTeamMembers;
    });

    it('should get display name correctly', () => {
      const displayName = (component as any).getDisplayName(
        'United States - NY'
      );
      expect(displayName).toBe('New York');
    });

    it('should get display name for unknown state', () => {
      const displayName = (component as any).getDisplayName(
        'United States - ZZ'
      );
      expect(displayName).toBe('ZZ');
    });

    it('should get display name without state code', () => {
      const displayName = (component as any).getDisplayName('United Kingdom');
      expect(displayName).toBe('United Kingdom');
    });

    it('should calculate average coordinates', () => {
      const members = mockTeamMembers.slice(0, 2);
      const avgCoords = (component as any).calculateAverageCoordinates(members);
      expect(avgCoords).toEqual([
        (-74.006 + -118.2437) / 2,
        (40.7128 + 34.0522) / 2,
        2,
      ]);
    });

    it('should return null for average coordinates with no valid members', () => {
      const members = [{ ...mockTeamMembers[0], coordinates: undefined }];
      const avgCoords = (component as any).calculateAverageCoordinates(members);
      expect(avgCoords).toBeNull();
    });

    it('should group teammates by location', () => {
      (component as any).groupTeammatesByLocation();

      expect((component as any).countryNodes.length).toBeGreaterThan(0);
      expect((component as any).stateNodes.length).toBeGreaterThan(0);
      expect((component as any).cityNodes.length).toBeGreaterThan(0);
    });

    it('should create tooltip formatter', () => {
      const locationGroups = new Map();
      locationGroups.set(1, [mockTeamMembers[0]]);

      const formatter = (component as any).createTooltipFormatter(
        locationGroups
      );
      const result = formatter({
        seriesType: 'scatter',
        data: {
          id: 1,
          city: 'New York',
          country: 'United States',
          state: 'NY',
        },
      });

      expect(result).toContain('New York, New York, USA');
      expect(result).toContain('John Doe');
    });

    it('should handle tooltip for country/state level', () => {
      const formatter = (component as any).createTooltipFormatter(new Map());
      const result = formatter({
        data: { level: 'country', name: 'United Kingdom', memberCount: 5 },
      });

      expect(result).toContain('United Kingdom');
      expect(result).toContain('5 team members');
    });

    it('should set error state', () => {
      (component as any).setErrorState();
      expect(component.chartOptions.title).toBeDefined();
    });

    it('should get country and state nodes', () => {
      (component as any).stateNodes = [{ id: 'state1' }];
      (component as any).countryNodes = [
        { id: 'country1', country: 'United States' },
        { id: 'country2', country: 'United Kingdom' },
      ];

      const nodes = (component as any).getCountryAndStateNodes();
      expect(nodes.length).toBe(2); // 1 state + 1 non-US country
    });
  });

  describe('Zoom Functionality', () => {
    beforeEach(() => {
      component.teammates = mockTeamMembers;
      fixture.detectChanges();
    });

    it('should update nodes based on zoom level', () => {
      const mockChart = {
        on: jest.fn(),
        getOption: jest.fn(() => ({ geo: [{ zoom: 5.5 }] })),
        setOption: jest.fn(),
      };

      component.chart = mockChart;
      (component as any).cityNodes = [{ id: 1, name: 'Test City' }];
      (component as any).currentZoom = 5.5;

      (component as any).updateNodesBasedOnZoom();

      expect(mockChart.setOption).toHaveBeenCalled();
    });

    it('should handle zoom change in georoam event', () => {
      const mockChart = {
        on: jest.fn(),
        getOption: jest.fn(() => ({ geo: [{ zoom: 3.0 }] })),
        setOption: jest.fn(),
      };

      component.onChartInit(mockChart);

      // Simulate the georoam callback
      const georoamCallback = mockChart.on.mock.calls[0][1];
      georoamCallback({});

      expect(mockChart.setOption).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty teammates array', () => {
      component.teammates = [];
      expect(component.teamSize).toBe(0);
      expect(component.uniqueLocations).toBe(0);
      expect(component.numSoftwareEngineers).toBe(0);
    });

    it('should handle teammates without coordinates', () => {
      const membersWithoutCoords = mockTeamMembers.map((m) => ({
        ...m,
        coordinates: undefined,
      }));
      component.teammates = membersWithoutCoords;

      (component as any).groupTeammatesByLocation();
      expect((component as any).cityNodes.length).toBe(0);
    });

    it('should handle pagination edge cases', () => {
      component.selectedTeammates = mockTeamMembers;
      component.pageSize = 10;
      component.currentPage = 5;

      const paginated = component.paginatedTeammates;
      expect(component.currentPage).toBe(1); // Should reset to 1 when exceeding total pages
    });

    it('should handle search with no results', () => {
      component.selectedTeammates = mockTeamMembers;
      component.searchTerm = 'nonexistent';

      const filtered = component.filteredTeammates;
      expect(filtered.length).toBe(0);
    });

    it('should handle tooltip with empty location groups', () => {
      const formatter = (component as any).createTooltipFormatter(new Map());
      const result = formatter({
        seriesType: 'scatter',
        data: { id: 999 },
      });
      expect(result).toBe('');
    });

    it('should handle tooltip with non-scatter series', () => {
      const formatter = (component as any).createTooltipFormatter(new Map());
      const result = formatter({
        seriesType: 'line',
        data: { id: 1 },
      });
      expect(result).toBe('');
    });

    it('should handle chart click with missing coordinates', () => {
      const event = {
        data: {
          id: 999,
          level: 'city',
          city: 'Unknown City',
          country: 'Unknown Country',
        },
      };

      component.onChartClick(event);
      expect(component.selectedTeammates.length).toBe(0);
    });

    it('should handle zoom update with no city nodes', () => {
      const mockChart = {
        on: jest.fn(),
        getOption: jest.fn(() => ({ geo: [{ zoom: 5.5 }] })),
        setOption: jest.fn(),
      };

      component.chart = mockChart;
      (component as any).cityNodes = [];
      (component as any).currentZoom = 5.5;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      (component as any).updateNodesBasedOnZoom();

      expect(consoleSpy).toHaveBeenCalledWith(
        'No city nodes available, falling back to country/state nodes'
      );
      consoleSpy.mockRestore();
    });

    it('should handle members with null locationId', () => {
      const membersWithNullId = mockTeamMembers.map((m) => ({
        ...m,
        locationId: null,
      }));
      component.teammates = membersWithNullId;

      (component as any).groupTeammatesByLocation();
      expect((component as any).cityNodes.length).toBeGreaterThan(0);
    });

    it('should handle tooltip with more than 5 teammates', () => {
      const manyTeammates = Array.from({ length: 8 }, (_, i) => ({
        ...mockTeamMembers[0],
        id: i + 1,
        name: `Person ${i + 1}`,
      }));

      const locationGroups = new Map();
      locationGroups.set(1, manyTeammates);

      const formatter = (component as any).createTooltipFormatter(
        locationGroups
      );
      const result = formatter({
        seriesType: 'scatter',
        data: { id: 1, city: 'Test City', country: 'Test Country' },
      });

      expect(result).toContain('+3 more teammates');
    });

    it('should handle try-catch error in ngOnInit', () => {
      const originalService = component['teamDemographicsService'];
      // Force an error by setting service to null
      (component as any).teamDemographicsService = null;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      component.ngOnInit();

      expect(consoleSpy).toHaveBeenCalled();
      expect(component.isLoadingData).toBe(false);

      consoleSpy.mockRestore();
      (component as any).teamDemographicsService = originalService;
    });

    it('should handle georoam event with significant zoom change', () => {
      const mockChart = {
        on: jest.fn(),
        getOption: jest.fn(() => ({ geo: [{ zoom: 4.0 }] })),
        setOption: jest.fn(),
      };

      component.onChartInit(mockChart);
      (component as any).currentZoom = 2.0; // Set initial zoom

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Simulate the georoam callback
      const georoamCallback = mockChart.on.mock.calls[0][1];
      georoamCallback({});

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Zoom changed from')
      );
      consoleSpy.mockRestore();
    });

    it('should handle chart click for state with no teammates', () => {
      component.teammates = []; // Empty teammates array

      const event = {
        data: {
          id: 'US-CA',
          level: 'state',
          name: 'California',
          state: 'CA',
        },
      };

      component.onChartClick(event);
      expect(component.selectedTeammates.length).toBe(0);
      expect(component.isTableVisible).toBe(true);
    });
  });
});
