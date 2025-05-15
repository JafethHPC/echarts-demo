import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Location } from '../models/location.model';

@Injectable({
  providedIn: 'root',
})
export class LocationCacheService {
  private locations: Map<number, Location> = new Map();
  private locationLookup: Map<string, number> = new Map();
  private nextId = 1;

  constructor() {
    // Initialize with some sample locations
    this.addLocation({
      id: this.nextId++,
      city: 'New York',
      state: 'NY',
      country: 'United States',
      lat: 40.7128,
      lon: -74.006,
    });

    this.addLocation({
      id: this.nextId++,
      city: 'Paris',
      state: '',
      country: 'France',
      lat: 48.8566,
      lon: 2.3522,
    });

    this.addLocation({
      id: this.nextId++,
      city: 'London',
      state: '',
      country: 'United Kingdom',
      lat: 51.5074,
      lon: -0.1278,
    });
  }

  // Get location by ID
  getLocation(id: number): Observable<Location | undefined> {
    // Simulate API call with delay
    return of(this.locations.get(id)).pipe(delay(100));
  }

  // Check if location exists by city, state, country
  findLocationId(
    city: string,
    state: string,
    country: string
  ): Observable<number | null> {
    const key = this.getLocationKey(city, state, country);
    const id = this.locationLookup.get(key) || null;

    // Simulate API call with delay
    return of(id).pipe(delay(50));
  }

  // Add a new location
  addLocation(location: Location): Observable<Location> {
    if (!location.id) {
      location.id = this.nextId++;
    }

    this.locations.set(location.id, location);

    const key = this.getLocationKey(
      location.city,
      location.state,
      location.country
    );
    this.locationLookup.set(key, location.id);

    // Simulate API call with delay
    return of(location).pipe(delay(200));
  }

  // Get all locations
  getAllLocations(): Observable<Location[]> {
    return of(Array.from(this.locations.values())).pipe(delay(100));
  }

  // Helper method to create a consistent lookup key
  private getLocationKey(city: string, state: string, country: string): string {
    return `${city.toLowerCase()}|${state.toLowerCase()}|${country.toLowerCase()}`;
  }
}
