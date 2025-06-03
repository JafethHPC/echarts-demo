const XLSX = require("xlsx");
const fs = require("fs");
const https = require("https");

// Free geocoding service using Nominatim (OpenStreetMap)
const GEOCODING_API_BASE = "https://nominatim.openstreetmap.org/search";

class LocationGeocoder {
  constructor() {
    this.delay = 1000; // 1 second delay between requests to respect rate limits
    this.results = {};
  }

  async geocodeLocation(city, state, country) {
    // Build query string
    let query = city;
    if (state) query += `, ${state}`;
    if (country) query += `, ${country}`;

    const url = `${GEOCODING_API_BASE}?q=${encodeURIComponent(
      query
    )}&format=json&limit=1&addressdetails=1`;

    try {
      const response = await this.makeRequest(url);
      const data = JSON.parse(response);

      if (data && data.length > 0) {
        const location = data[0];
        return {
          lat: parseFloat(location.lat),
          lon: parseFloat(location.lon),
          display_name: location.display_name,
        };
      }

      // Fallback: try without state if first attempt failed
      if (state) {
        const fallbackQuery = `${city}, ${country}`;
        const fallbackUrl = `${GEOCODING_API_BASE}?q=${encodeURIComponent(
          fallbackQuery
        )}&format=json&limit=1`;
        const fallbackResponse = await this.makeRequest(fallbackUrl);
        const fallbackData = JSON.parse(fallbackResponse);

        if (fallbackData && fallbackData.length > 0) {
          const location = fallbackData[0];
          return {
            lat: parseFloat(location.lat),
            lon: parseFloat(location.lon),
            display_name: location.display_name,
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`Error geocoding ${query}:`, error.message);
      return null;
    }
  }

  makeRequest(url) {
    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          "User-Agent": "LocationGeocoder/1.0 (your-email@example.com)", // Replace with your email
        },
      };

      https
        .get(url, options, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            if (res.statusCode === 200) {
              resolve(data);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            }
          });
        })
        .on("error", reject);
    });
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async processXLSXFile(filePath) {
    console.log(`Reading XLSX file: ${filePath}`);

    // Read the XLSX file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Found ${data.length} locations to geocode`);

    const results = {};
    let processed = 0;

    for (const row of data) {
      const city = row.CITY?.trim();
      const state = row.STATENAME?.trim();
      const country = row.COUNTRY_CODE?.trim();

      if (!city || !country) {
        console.warn(`Skipping row with missing data: ${JSON.stringify(row)}`);
        continue;
      }

      // Create a unique key for this location
      const locationKey = `${city.toLowerCase()}|${(
        state || ""
      ).toLowerCase()}|${country.toLowerCase()}`;

      // Skip if we already processed this location
      if (results[locationKey]) {
        console.log(`Skipping duplicate: ${city}, ${state}, ${country}`);
        continue;
      }

      console.log(
        `Geocoding (${++processed}/${
          data.length
        }): ${city}, ${state}, ${country}`
      );

      const coords = await this.geocodeLocation(city, state, country);

      if (coords) {
        results[locationKey] = {
          city: city,
          state: state || "",
          country: country,
          latitude: coords.lat,
          longitude: coords.lon,
          display_name: coords.display_name,
        };
        console.log(`✓ Found: ${coords.lat}, ${coords.lon}`);
      } else {
        console.log(`✗ Not found: ${city}, ${state}, ${country}`);
        // Still add to results but with null coordinates
        results[locationKey] = {
          city: city,
          state: state || "",
          country: country,
          latitude: null,
          longitude: null,
          display_name: null,
        };
      }

      // Rate limiting - wait between requests
      if (processed < data.length) {
        await this.sleep(this.delay);
      }
    }

    return results;
  }

  async run(inputFile, outputFile = "geocoded-locations.json") {
    try {
      console.log("Starting geocoding process...");
      const results = await this.processXLSXFile(inputFile);

      // Convert to array format for easier use
      const locationsArray = Object.values(results);

      const output = {
        metadata: {
          total_locations: locationsArray.length,
          successful_geocodes: locationsArray.filter(
            (loc) => loc.latitude !== null
          ).length,
          failed_geocodes: locationsArray.filter((loc) => loc.latitude === null)
            .length,
          generated_at: new Date().toISOString(),
        },
        locations: results,
      };

      // Write to JSON file
      fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

      console.log(`\n✅ Geocoding complete!`);
      console.log(`📊 Results:`);
      console.log(`   - Total locations: ${output.metadata.total_locations}`);
      console.log(
        `   - Successfully geocoded: ${output.metadata.successful_geocodes}`
      );
      console.log(`   - Failed to geocode: ${output.metadata.failed_geocodes}`);
      console.log(`📁 Output saved to: ${outputFile}`);
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: node geocoding-script.js <input-file.xlsx> [output-file.json]

Example:
  node geocoding-script.js locations.xlsx
  node geocoding-script.js locations.xlsx my-geocoded-data.json

The input XLSX file should have columns: CITY, STATENAME, COUNTRY_CODE
    `);
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || "geocoded-locations.json";

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file '${inputFile}' not found`);
    process.exit(1);
  }

  const geocoder = new LocationGeocoder();
  geocoder.run(inputFile, outputFile);
}

module.exports = LocationGeocoder;
