import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import teammatesData from '../../assets/teammates.json';
import { Location, TeamMember } from './models/location.model';
import { LocationCacheService } from './services/location-cache.service';
import { GeocodingService } from './services/geocoding.service';

@Injectable({ providedIn: 'root' })
export class TeamDemographicsService {
  private processingBatchGeocode = false;

  constructor(
    private locationCacheService: LocationCacheService,
    private geocodingService: GeocodingService
  ) {}

  /**
   * Get team demographics data with location information
   */
  getTeamDemographicsData(): Observable<TeamMember[]> {
    // First, transform the raw teammates data into our TeamMember model
    const teamMembers: TeamMember[] = teammatesData.teammates.map(
      (teammate: any) => {
        const state =
          teammate.state || this.extractState(teammate.country) || '';
        const country = this.extractCountry(teammate.country);

        return {
          name: teammate.name,
          role: teammate.role,
          profilePic: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            teammate.name
          )}&background=random&size=128`,
          city: teammate.city,
          state,
          country,
          locationId: null,
          // Optional fields
          id: teammate.id,
          hrManager: teammate.hrManager,
          timeZone: teammate.timeZone,
        };
      }
    );

    // Process locations in batch for any members without a locationId
    return this.processTeamLocations(teamMembers);
  }

  /**
   * Gets all unique locations from teammates
   */
  private getUniqueLocations(
    teamMembers: TeamMember[]
  ): { city: string; state: string; country: string }[] {
    const locationMap = new Map<
      string,
      { city: string; state: string; country: string }
    >();

    teamMembers.forEach((member) => {
      if (member.city && member.country) {
        const key = this.getLocationKey(
          member.city,
          member.state || '',
          member.country
        );
        if (!locationMap.has(key)) {
          locationMap.set(key, {
            city: member.city,
            state: member.state || '',
            country: member.country,
          });
        }
      }
    });

    return Array.from(locationMap.values());
  }

  /**
   * Process team locations, either from cache or by geocoding
   */
  private processTeamLocations(
    teamMembers: TeamMember[]
  ): Observable<TeamMember[]> {
    // Extract unique locations that need processing
    const uniqueLocations = this.getUniqueLocations(teamMembers);

    // Check which locations exist in cache
    const locationChecks: Observable<{
      location: { city: string; state: string; country: string };
      id: number | null;
    }>[] = uniqueLocations.map((location) =>
      this.locationCacheService
        .findLocationId(location.city, location.state, location.country)
        .pipe(map((id) => ({ location, id })))
    );

    return forkJoin(locationChecks).pipe(
      switchMap((results) => {
        // Separate into cached and uncached locations
        const cachedLocationIds = new Map<string, number>();
        const locationsToGeocode: {
          city: string;
          state: string;
          country: string;
        }[] = [];

        results.forEach((result) => {
          const { location, id } = result;
          const key = this.getLocationKey(
            location.city,
            location.state,
            location.country
          );

          if (id !== null) {
            cachedLocationIds.set(key, id);
          } else {
            locationsToGeocode.push(location);
          }
        });

        // Early return if all locations are cached
        if (locationsToGeocode.length === 0) {
          return this.assignLocationIdsToMembers(
            teamMembers,
            cachedLocationIds
          );
        }

        // Geocode missing locations in batch
        return this.geocodeAndCacheLocations(locationsToGeocode).pipe(
          switchMap((newLocations) => {
            // Add newly geocoded locations to our map
            newLocations.forEach((location) => {
              const key = this.getLocationKey(
                location.city,
                location.state,
                location.country
              );
              cachedLocationIds.set(key, location.id);
            });

            return this.assignLocationIdsToMembers(
              teamMembers,
              cachedLocationIds
            );
          })
        );
      })
    );
  }

  /**
   * Geocode locations that aren't in cache and store them
   */
  private geocodeAndCacheLocations(
    locations: { city: string; state: string; country: string }[]
  ): Observable<Location[]> {
    if (locations.length === 0) {
      return of([]);
    }

    this.processingBatchGeocode = true;

    // Do batch geocoding
    return this.geocodingService.batchGeocodeLocations(locations).pipe(
      // Cache each geocoded location
      mergeMap((geocodedLocations) => {
        const saveOperations = geocodedLocations.map((location) =>
          this.locationCacheService.addLocation(location)
        );

        return forkJoin(saveOperations);
      }),
      tap(() => {
        this.processingBatchGeocode = false;
      }),
      catchError((error) => {
        this.processingBatchGeocode = false;
        console.error('Error geocoding locations:', error);
        return of([]);
      })
    );
  }

  /**
   * Assign location IDs to team members based on the cache
   */
  private assignLocationIdsToMembers(
    members: TeamMember[],
    locationIdMap: Map<string, number>
  ): Observable<TeamMember[]> {
    const result = members.map((member) => {
      if (member.city && member.country) {
        const key = this.getLocationKey(
          member.city,
          member.state || '',
          member.country
        );
        const locationId = locationIdMap.get(key);
        if (locationId) {
          return { ...member, locationId };
        }
      }
      return member;
    });

    return of(result);
  }

  /**
   * Helper method to get coordinates for an array of team members
   * Used by the map component to place people on the map
   */
  getTeamMembersWithCoordinates(): Observable<
    Array<TeamMember & { coordinates?: [number, number] }>
  > {
    return this.getTeamDemographicsData().pipe(
      switchMap((members) => {
        const locationIds = new Set<number>();
        members.forEach((member) => {
          if (member.locationId) {
            locationIds.add(member.locationId);
          }
        });

        // Fetch all necessary location data
        const locationFetches = Array.from(locationIds).map((id) =>
          this.locationCacheService.getLocation(id)
        );

        if (locationFetches.length === 0) {
          return of(members);
        }

        return forkJoin(locationFetches).pipe(
          map((locations) => {
            // Create a map for quick lookup
            const locationMap = new Map<number, Location>();
            locations.forEach((location) => {
              if (location) {
                locationMap.set(location.id, location);
              }
            });

            // Attach coordinates to each member
            return members.map((member) => {
              if (member.locationId && locationMap.has(member.locationId)) {
                const location = locationMap.get(member.locationId)!;
                return {
                  ...member,
                  coordinates: [location.lon, location.lat] as [number, number],
                };
              }
              return member;
            });
          })
        );
      })
    );
  }

  /**
   * Extract state from country string (e.g., "United States - NC" → "NC")
   */
  private extractState(countryString: string): string | null {
    if (!countryString) return null;

    const parts = countryString.split(' - ');
    if (parts.length === 2) {
      return parts[1];
    }
    return null;
  }

  /**
   * Extract country from country string (e.g., "United States - NC" → "United States")
   */
  private extractCountry(countryString: string): string {
    if (!countryString) return '';

    const parts = countryString.split(' - ');
    return parts[0];
  }

  /**
   * Generate a consistent lookup key for locations
   */
  private getLocationKey(city: string, state: string, country: string): string {
    return `${city.toLowerCase()}|${state.toLowerCase()}|${country.toLowerCase()}`;
  }

  /**
   * Fetch locationId for a team member based on city, state, and country
   * If location doesn't exist in cache, it will be geocoded and stored
   */
  fetchLocationIdForTeamMember(
    teamMember: TeamMember
  ): Observable<number | null> {
    // First check if location exists in cache
    return this.locationCacheService
      .findLocationId(teamMember.city, teamMember.state, teamMember.country)
      .pipe(
        switchMap((locationId) => {
          if (locationId !== null) {
            // Location found in cache
            return of(locationId);
          }

          // Location not in cache, geocode it
          return this.geocodingService
            .geocodeLocation(
              teamMember.city,
              teamMember.state,
              teamMember.country
            )
            .pipe(
              switchMap((location) => {
                if (!location) {
                  return of(null);
                }

                // Cache the new location
                return this.locationCacheService
                  .addLocation(location)
                  .pipe(map((savedLocation) => savedLocation.id));
              })
            );
        })
      );
  }

  /**
   * Update an existing team member with location information
   */
  updateTeamMemberWithLocation(teamMember: TeamMember): Observable<TeamMember> {
    if (!teamMember.city || !teamMember.country) {
      return of(teamMember); // Can't geocode without city and country
    }

    return this.fetchLocationIdForTeamMember(teamMember).pipe(
      map((locationId) => ({
        ...teamMember,
        locationId,
      }))
    );
  }
}
