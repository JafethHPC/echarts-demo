# XLSX Location Geocoder

A Node.js script that reads XLSX files containing location data (CITY, STATENAME, COUNTRY_CODE) and geocodes them to get latitude/longitude coordinates using the free Nominatim API.

## Features

- ✅ Reads XLSX files with location data
- ✅ Geocodes locations using free Nominatim API (OpenStreetMap)
- ✅ Handles rate limiting (1 second between requests)
- ✅ Fallback geocoding (tries without state if initial query fails)
- ✅ Deduplicates identical locations
- ✅ Outputs detailed JSON with metadata
- ✅ Command-line interface
- ✅ Programmatic API

## Installation

1. Install Node.js (if not already installed)
2. Install dependencies:

```bash
npm install xlsx
```

Or copy the `package-geocoder.json` to `package.json` and run:

```bash
npm install
```

## Usage

### Command Line

```bash
node geocoding-script.js <input-file.xlsx> [output-file.json]
```

Examples:

```bash
# Basic usage
node geocoding-script.js locations.xlsx

# Custom output file
node geocoding-script.js locations.xlsx my-geocoded-data.json
```

### Programmatic Usage

```javascript
const LocationGeocoder = require("./geocoding-script");

const geocoder = new LocationGeocoder();

// Geocode a single location
const coords = await geocoder.geocodeLocation("New York", "NY", "US");
console.log(coords); // { lat: 40.7128, lon: -74.006, display_name: "..." }

// Process entire XLSX file
await geocoder.run("input.xlsx", "output.json");
```

## Input Format

Your XLSX file should have these columns:

- `CITY` - City name (required)
- `STATENAME` - State/province name (optional)
- `COUNTRY_CODE` - Country code or name (required)

Example:
| CITY | STATENAME | COUNTRY_CODE |
|------|-----------|--------------|
| New York | NY | US |
| London | | GB |
| Tokyo | | JP |

## Output Format

The script generates a JSON file with this structure:

```json
{
  "metadata": {
    "total_locations": 3,
    "successful_geocodes": 3,
    "failed_geocodes": 0,
    "generated_at": "2024-01-15T10:30:00.000Z"
  },
  "locations": {
    "new york|ny|us": {
      "city": "New York",
      "state": "NY",
      "country": "US",
      "latitude": 40.7128,
      "longitude": -74.006,
      "display_name": "New York, NY, United States"
    },
    "london||gb": {
      "city": "London",
      "state": "",
      "country": "GB",
      "latitude": 51.5074,
      "longitude": -0.1278,
      "display_name": "London, England, United Kingdom"
    }
  }
}
```

## Testing

Run the test script to see it in action:

```bash
node test-geocoder.js
```

This will:

1. Create a sample XLSX file
2. Geocode the locations
3. Display the results

## Rate Limiting

The script includes a 1-second delay between API requests to respect Nominatim's usage policy. For large datasets, consider:

1. Using a paid geocoding service for faster processing
2. Caching results to avoid re-geocoding the same locations
3. Running the script in batches

## API Used

This script uses the free [Nominatim API](https://nominatim.openstreetmap.org/) from OpenStreetMap. Please:

- Don't abuse the service (hence the rate limiting)
- Consider donating to OpenStreetMap if you find it useful
- For production/commercial use, consider paid alternatives like Google Maps API

## Customization

You can easily modify the script to:

- Use different geocoding APIs (Google, Mapbox, etc.)
- Change the rate limiting delay
- Add more fallback strategies
- Customize the output format
- Add data validation

## Error Handling

The script handles:

- Missing or invalid input files
- Network errors during geocoding
- Malformed XLSX data
- API rate limiting
- Locations that can't be geocoded (marked with null coordinates)

## License

MIT License - feel free to modify and use as needed.
