declare module 'cities.json' {
  interface City {
    name: string;
    lat: string;
    lng: string;
    country: string;
    admin1: string;
    admin2: string;
  }

  const cities: City[];
  export = cities;
}
