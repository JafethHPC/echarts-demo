import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import teammatesData from '../../assets/teammates.json';
import geocodedData from '../../assets/geocoded-locations.json';
import { TeamMember } from './models/location.model';

@Injectable({ providedIn: 'root' })
export class TeamDemographicsService {
  constructor() {}

  /**
   * Get team demographics data with location information
   */
  getTeamDemographicsData(): Observable<TeamMember[]> {
    const teamMembers: TeamMember[] = teammatesData.teammates.map(
      (teammate: any, index: number) => {
        return {
          id: index + 1,
          name: teammate.name,
          role: teammate.role,
          profilePic: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            teammate.name
          )}&background=random&size=128`,
          city: teammate.city,
          state: teammate.state || '',
          country: teammate.country,
          locationId: index + 1,
          hrManager: teammate.hrManager,
          timeZone: teammate.timeZone,
        };
      }
    );

    return of(teamMembers);
  }

  /**
   * Get team members with coordinates from the geocoded data
   */
  getTeamMembersWithCoordinates(): Observable<
    Array<TeamMember & { coordinates?: [number, number] }>
  > {
    return this.getTeamDemographicsData().pipe(
      map((members) => {
        return members.map((member) => {
          const locationKey = this.getLocationKey(
            member.city,
            member.state || '',
            member.country
          );

          const geocodedLocation = (geocodedData.locations as any)[locationKey];

          if (geocodedLocation) {
            return {
              ...member,
              coordinates: [
                geocodedLocation.longitude,
                geocodedLocation.latitude,
              ] as [number, number],
            };
          }

          // Fallback coordinates if not found in geocoded data
          console.warn(`No coordinates found for: ${locationKey}`);
          return {
            ...member,
            coordinates: [0, 0] as [number, number],
          };
        });
      })
    );
  }

  private getLocationKey(city: string, state: string, country: string): string {
    return `${city.toLowerCase()}|${(
      state || ''
    ).toLowerCase()}|${country.toLowerCase()}`;
  }
}
