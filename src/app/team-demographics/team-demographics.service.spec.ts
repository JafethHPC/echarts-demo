import { TestBed } from '@angular/core/testing';
import { TeamDemographicsService } from './team-demographics.service';
import { TeamMember } from './models/location.model';

// Mock the JSON imports
jest.mock('../../assets/teammates.json', () => ({
  teammates: [
    {
      name: 'John Doe',
      role: 'Software Engineer',
      city: 'New York',
      state: 'NY',
      country: 'United States',
      hrManager: 'Manager 1',
      timeZone: 'EST',
    },
    {
      name: 'Jane Smith',
      role: 'Quality Specialist',
      city: 'Los Angeles',
      state: 'CA',
      country: 'United States',
      hrManager: 'Manager 2',
      timeZone: 'PST',
    },
    {
      name: 'Bob Johnson',
      role: 'Scrum Master',
      city: 'London',
      state: '',
      country: 'United Kingdom',
      hrManager: 'Manager 3',
      timeZone: 'GMT',
    },
  ],
}));

jest.mock('../../assets/geocoded-locations.json', () => ({
  locations: {
    'new york|ny|united states': {
      latitude: 40.7128,
      longitude: -74.006,
    },
    'los angeles|ca|united states': {
      latitude: 34.0522,
      longitude: -118.2437,
    },
    'london||united kingdom': {
      latitude: 51.5074,
      longitude: -0.1278,
    },
  },
}));

describe('TeamDemographicsService', () => {
  let service: TeamDemographicsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TeamDemographicsService);
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('getTeamDemographicsData', () => {
    it('should return team demographics data', (done) => {
      service.getTeamDemographicsData().subscribe((members: TeamMember[]) => {
        expect(members).toBeDefined();
        expect(members.length).toBe(3);

        // Check first member
        expect(members[0].id).toBe(1);
        expect(members[0].name).toBe('John Doe');
        expect(members[0].role).toBe('Software Engineer');
        expect(members[0].city).toBe('New York');
        expect(members[0].state).toBe('NY');
        expect(members[0].country).toBe('United States');
        expect(members[0].hrManager).toBe('Manager 1');
        expect(members[0].timeZone).toBe('EST');
        expect(members[0].locationId).toBe(1);
        expect(members[0].profilePic).toContain('ui-avatars.com');

        done();
      });
    });

    it('should generate profile pictures with encoded names', (done) => {
      service.getTeamDemographicsData().subscribe((members: TeamMember[]) => {
        const johnDoe = members.find((m) => m.name === 'John Doe');
        expect(johnDoe?.profilePic).toContain('John%20Doe');

        done();
      });
    });

    it('should handle empty state correctly', (done) => {
      service.getTeamDemographicsData().subscribe((members: TeamMember[]) => {
        const bobJohnson = members.find((m) => m.name === 'Bob Johnson');
        expect(bobJohnson?.state).toBe('');

        done();
      });
    });
  });

  describe('getTeamMembersWithCoordinates', () => {
    it('should return team members with coordinates', (done) => {
      service.getTeamMembersWithCoordinates().subscribe((members) => {
        expect(members).toBeDefined();
        expect(members.length).toBe(3);

        // Check coordinates are added
        const johnDoe = members.find((m) => m.name === 'John Doe');
        expect(johnDoe?.coordinates).toEqual([-74.006, 40.7128]);

        const janeSmith = members.find((m) => m.name === 'Jane Smith');
        expect(janeSmith?.coordinates).toEqual([-118.2437, 34.0522]);

        const bobJohnson = members.find((m) => m.name === 'Bob Johnson');
        expect(bobJohnson?.coordinates).toEqual([-0.1278, 51.5074]);

        done();
      });
    });

    it('should handle missing coordinates with fallback', (done) => {
      // Mock a member that won't be found in geocoded data
      const originalGetTeamDemographicsData = service.getTeamDemographicsData;
      service.getTeamDemographicsData = jest.fn().mockReturnValue(
        service['getTeamDemographicsData']().pipe(
          // Add a member that won't have coordinates
          map((members: TeamMember[]) => [
            ...members,
            {
              id: 4,
              name: 'Unknown Person',
              role: 'Test Role',
              profilePic: 'test.jpg',
              city: 'Unknown City',
              state: 'XX',
              country: 'Unknown Country',
              locationId: 4,
              hrManager: 'Test Manager',
              timeZone: 'UTC',
            },
          ])
        )
      );

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      service.getTeamMembersWithCoordinates().subscribe((members) => {
        const unknownMember = members.find((m) => m.name === 'Unknown Person');
        expect(unknownMember?.coordinates).toEqual([0, 0]);
        expect(consoleSpy).toHaveBeenCalledWith(
          'No coordinates found for: unknown city|xx|unknown country'
        );

        consoleSpy.mockRestore();
        service.getTeamDemographicsData = originalGetTeamDemographicsData;
        done();
      });
    });

    it('should generate correct location keys', () => {
      const locationKey = (service as any).getLocationKey(
        'New York',
        'NY',
        'United States'
      );
      expect(locationKey).toBe('new york|ny|united states');
    });

    it('should handle empty state in location key', () => {
      const locationKey = (service as any).getLocationKey(
        'London',
        '',
        'United Kingdom'
      );
      expect(locationKey).toBe('london||united kingdom');
    });

    it('should handle case insensitive location keys', () => {
      const locationKey1 = (service as any).getLocationKey(
        'NEW YORK',
        'ny',
        'UNITED STATES'
      );
      const locationKey2 = (service as any).getLocationKey(
        'new york',
        'NY',
        'united states'
      );
      expect(locationKey1).toBe(locationKey2);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', () => {
      // This test ensures the service doesn't throw errors during normal operation
      expect(() => {
        service.getTeamDemographicsData().subscribe();
        service.getTeamMembersWithCoordinates().subscribe();
      }).not.toThrow();
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency between methods', (done) => {
      let demographicsData: TeamMember[];
      let coordinatesData: any[];

      service.getTeamDemographicsData().subscribe((data) => {
        demographicsData = data;

        service.getTeamMembersWithCoordinates().subscribe((coordData) => {
          coordinatesData = coordData;

          // Should have same number of members
          expect(demographicsData.length).toBe(coordinatesData.length);

          // Should have same member names
          demographicsData.forEach((member, index) => {
            expect(member.name).toBe(coordinatesData[index].name);
            expect(member.id).toBe(coordinatesData[index].id);
          });

          done();
        });
      });
    });
  });
});

// Add import for map operator if needed
import { map } from 'rxjs/operators';
