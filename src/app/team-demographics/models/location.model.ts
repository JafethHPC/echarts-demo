export interface Location {
  id: number;
  city: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
}

export interface TeamMember {
  name: string;
  role: string;
  profilePic: string;
  city: string;
  state: string;
  country: string;
  locationId: number | null;
  // Optional fields that might be used elsewhere
  id?: number;
  hrManager?: string;
  timeZone?: string;
  // Coordinates for plotting on map [longitude, latitude]
  coordinates?: [number, number];
}
