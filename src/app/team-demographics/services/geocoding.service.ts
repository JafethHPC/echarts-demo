import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Location } from '../models/location.model';

// Sample geocoding data with index signature
const GEOCODE_SAMPLES: { [key: string]: { lat: number; lon: number } } = {
  'new york|ny|united states': { lat: 40.7128, lon: -74.006 },
  'los angeles|ca|united states': { lat: 34.0522, lon: -118.2437 },
  'chicago|il|united states': { lat: 41.8781, lon: -87.6298 },
  'houston|tx|united states': { lat: 29.7604, lon: -95.3698 },
  'phoenix|az|united states': { lat: 33.4484, lon: -112.074 },
  'philadelphia|pa|united states': { lat: 39.9526, lon: -75.1652 },
  'san antonio|tx|united states': { lat: 29.4241, lon: -98.4936 },
  'san diego|ca|united states': { lat: 32.7157, lon: -117.1611 },
  'dallas|tx|united states': { lat: 32.7767, lon: -96.797 },
  'austin|tx|united states': { lat: 30.2672, lon: -97.7431 },
  'london||united kingdom': { lat: 51.5074, lon: -0.1278 },
  'manchester||united kingdom': { lat: 53.4808, lon: -2.2426 },
  'birmingham||united kingdom': { lat: 52.4862, lon: -1.8904 },
  'edinburgh||united kingdom': { lat: 55.9533, lon: -3.1883 },
  'paris||france': { lat: 48.8566, lon: 2.3522 },
  'lyon||france': { lat: 45.764, lon: 4.8357 },
  'marseille||france': { lat: 43.2965, lon: 5.3698 },
  'bordeaux||france': { lat: 44.8378, lon: -0.5792 },
  'berlin||germany': { lat: 52.52, lon: 13.405 },
  'munich||germany': { lat: 48.1351, lon: 11.582 },
  'hamburg||germany': { lat: 53.5511, lon: 9.9937 },
  'cologne||germany': { lat: 50.9375, lon: 6.9603 },
  'tokyo||japan': { lat: 35.6762, lon: 139.6503 },
  'osaka||japan': { lat: 34.6937, lon: 135.5023 },
  'kyoto||japan': { lat: 35.0116, lon: 135.7681 },
  'fukuoka||japan': { lat: 33.5904, lon: 130.4017 },
  'bangalore||india': { lat: 12.9716, lon: 77.5946 },
  'mumbai||india': { lat: 19.076, lon: 72.8777 },
  'delhi||india': { lat: 28.7041, lon: 77.1025 },
  'hyderabad||india': { lat: 17.385, lon: 78.4867 },
  'chennai||india': { lat: 13.0827, lon: 80.2707 },
  'pune||india': { lat: 18.5204, lon: 73.8567 },
  'shanghai||china': { lat: 31.2304, lon: 121.4737 },
  'beijing||china': { lat: 39.9042, lon: 116.4074 },
  'shenzhen||china': { lat: 22.5431, lon: 114.0579 },
  'guangzhou||china': { lat: 23.1291, lon: 113.2644 },
  'chengdu||china': { lat: 30.5723, lon: 104.0665 },
  'madrid||spain': { lat: 40.4168, lon: -3.7038 },
  'barcelona||spain': { lat: 41.3851, lon: 2.1734 },
  'seville||spain': { lat: 37.3891, lon: -5.9845 },
  'valencia||spain': { lat: 39.4699, lon: -0.3763 },
};

// Define known country/region center points for fallback geocoding
const COUNTRY_CENTERS: { [key: string]: { lat: number; lon: number } } = {
  'united states': { lat: 37.0902, lon: -95.7129 },
  'united kingdom': { lat: 55.3781, lon: -3.436 },
  france: { lat: 46.2276, lon: 2.2137 },
  germany: { lat: 51.1657, lon: 10.4515 },
  spain: { lat: 40.4637, lon: -3.7492 },
  italy: { lat: 41.8719, lon: 12.5674 },
  canada: { lat: 56.1304, lon: -106.3468 },
  australia: { lat: -25.2744, lon: 133.7751 },
  japan: { lat: 36.2048, lon: 138.2529 },
  china: { lat: 35.8617, lon: 104.1954 },
  india: { lat: 20.5937, lon: 78.9629 },
  brazil: { lat: -14.235, lon: -51.9253 },
  russia: { lat: 61.524, lon: 105.3188 },
  mexico: { lat: 23.6345, lon: -102.5528 },
  'south africa': { lat: -30.5595, lon: 22.9375 },
};

// Define US State centers
const US_STATE_CENTERS: { [key: string]: { lat: number; lon: number } } = {
  al: { lat: 32.3182, lon: -86.9023 }, // Alabama
  ak: { lat: 64.2008, lon: -149.4937 }, // Alaska
  az: { lat: 33.7298, lon: -111.4312 }, // Arizona
  ar: { lat: 34.9697, lon: -92.3731 }, // Arkansas
  ca: { lat: 36.1162, lon: -119.6816 }, // California
  co: { lat: 39.0598, lon: -105.3111 }, // Colorado
  ct: { lat: 41.5978, lon: -72.7554 }, // Connecticut
  de: { lat: 38.9108, lon: -75.5277 }, // Delaware
  fl: { lat: 27.6648, lon: -81.5158 }, // Florida
  ga: { lat: 32.1656, lon: -82.9001 }, // Georgia
  hi: { lat: 19.8968, lon: -155.5828 }, // Hawaii
  id: { lat: 44.0682, lon: -114.742 }, // Idaho
  il: { lat: 40.6331, lon: -89.3985 }, // Illinois
  in: { lat: 39.8494, lon: -86.2583 }, // Indiana
  ia: { lat: 42.0115, lon: -93.2105 }, // Iowa
  ks: { lat: 38.5266, lon: -96.7265 }, // Kansas
  ky: { lat: 37.6681, lon: -84.6701 }, // Kentucky
  la: { lat: 31.1695, lon: -91.8678 }, // Louisiana
  me: { lat: 44.6939, lon: -69.3819 }, // Maine
  md: { lat: 39.0639, lon: -76.8021 }, // Maryland
  ma: { lat: 42.2302, lon: -71.5301 }, // Massachusetts
  mi: { lat: 43.3266, lon: -84.5361 }, // Michigan
  mn: { lat: 45.6945, lon: -93.9002 }, // Minnesota
  ms: { lat: 32.7416, lon: -89.6787 }, // Mississippi
  mo: { lat: 38.4561, lon: -92.2884 }, // Missouri
  mt: { lat: 46.9219, lon: -110.4544 }, // Montana
  ne: { lat: 41.4925, lon: -99.9018 }, // Nebraska
  nv: { lat: 38.8026, lon: -116.4194 }, // Nevada
  nh: { lat: 43.4525, lon: -71.5639 }, // New Hampshire
  nj: { lat: 40.0583, lon: -74.4057 }, // New Jersey
  nm: { lat: 34.5199, lon: -105.8701 }, // New Mexico
  ny: { lat: 42.1657, lon: -74.9481 }, // New York
  nc: { lat: 35.6301, lon: -79.8064 }, // North Carolina
  nd: { lat: 47.5289, lon: -99.784 }, // North Dakota
  oh: { lat: 40.3888, lon: -82.7649 }, // Ohio
  ok: { lat: 35.5653, lon: -96.9289 }, // Oklahoma
  or: { lat: 44.572, lon: -122.0709 }, // Oregon
  pa: { lat: 40.5908, lon: -77.2098 }, // Pennsylvania
  ri: { lat: 41.6809, lon: -71.5118 }, // Rhode Island
  sc: { lat: 33.8569, lon: -80.945 }, // South Carolina
  sd: { lat: 44.2998, lon: -99.4388 }, // South Dakota
  tn: { lat: 35.7478, lon: -86.6923 }, // Tennessee
  tx: { lat: 31.0545, lon: -97.5635 }, // Texas
  ut: { lat: 39.321, lon: -111.0937 }, // Utah
  vt: { lat: 44.0459, lon: -72.7107 }, // Vermont
  va: { lat: 37.7693, lon: -78.17 }, // Virginia
  wa: { lat: 47.3917, lon: -121.5708 }, // Washington
  wv: { lat: 38.5976, lon: -80.4549 }, // West Virginia
  wi: { lat: 44.2685, lon: -89.6165 }, // Wisconsin
  wy: { lat: 42.9957, lon: -107.5512 }, // Wyoming
};

@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  constructor() {}

  /**
   * Simulate geocoding API call for a single location
   */
  geocodeLocation(
    city: string,
    state: string,
    country: string
  ): Observable<Location | null> {
    const key = this.getLocationKey(city, state, country);

    // If we have sample data, use it
    if (GEOCODE_SAMPLES[key]) {
      const { lat, lon } = GEOCODE_SAMPLES[key];
      const location: Location = {
        id: 0, // Will be assigned by the cache service
        city,
        state,
        country,
        lat,
        lon,
      };

      // Simulate API delay
      return of(location).pipe(delay(500));
    }

    // Instead of completely random coordinates, generate a more realistic location
    const { lat, lon } = this.getSmartFallbackCoordinates(city, state, country);

    const location: Location = {
      id: 0,
      city,
      state,
      country,
      lat,
      lon,
    };

    // Simulate API delay (longer for "unknown" locations)
    return of(location).pipe(delay(800));
  }

  /**
   * Simulate a batch geocoding operation
   * This would be used when many locations need to be geocoded at once
   */
  batchGeocodeLocations(
    locations: { city: string; state: string; country: string }[]
  ): Observable<Location[]> {
    // Simulate processing multiple locations at once
    const results: Location[] = [];

    for (const loc of locations) {
      const key = this.getLocationKey(loc.city, loc.state, loc.country);
      let coords;

      if (GEOCODE_SAMPLES[key]) {
        coords = GEOCODE_SAMPLES[key];
      } else {
        // Use more realistic coordinates
        coords = this.getSmartFallbackCoordinates(
          loc.city,
          loc.state,
          loc.country
        );
      }

      results.push({
        id: 0, // Will be assigned by the cache service
        city: loc.city,
        state: loc.state,
        country: loc.country,
        lat: coords.lat,
        lon: coords.lon,
      });
    }

    // Simulate a faster batch API response (would be more efficient than individual calls)
    return of(results).pipe(delay(1200));
  }

  /**
   * Get more realistic coordinates based on country and state information
   */
  private getSmartFallbackCoordinates(
    city: string,
    state: string,
    country: string
  ): { lat: number; lon: number } {
    const countryLower = country.toLowerCase();
    const stateLower = state.toLowerCase();
    const hash = this.simpleHash(city.toLowerCase());

    // For US states, prefer state-based coordinates
    if (
      countryLower === 'united states' &&
      stateLower &&
      US_STATE_CENTERS[stateLower]
    ) {
      const baseCoords = US_STATE_CENTERS[stateLower];
      // Add a small random offset to scatter points within the state
      return {
        lat: baseCoords.lat + (hash % 100) / 100 - 0.5, // +/- 0.5 degrees
        lon: baseCoords.lon + ((hash * 7) % 100) / 100 - 0.5,
      };
    }

    // For known countries, use country centers
    for (const [knownCountry, coords] of Object.entries(COUNTRY_CENTERS)) {
      if (countryLower.includes(knownCountry)) {
        // Add a bigger offset for countries (they're larger than states)
        return {
          lat: coords.lat + (hash % 200) / 100 - 1, // +/- 1 degree
          lon: coords.lon + ((hash * 7) % 200) / 100 - 1,
        };
      }
    }

    // Fallback to the old method, but with a bit more constraint
    // This makes unknown points appear in oceans less often
    const latBase = (hash % 140) - 70; // Range: -70 to 70 (most populated areas)
    const lonBase = ((hash * 7) % 360) - 180; // Range: -180 to 180

    return {
      lat: latBase,
      lon: lonBase,
    };
  }

  // Helper methods
  private getLocationKey(city: string, state: string, country: string): string {
    return `${city.toLowerCase()}|${state.toLowerCase()}|${country.toLowerCase()}`;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}
