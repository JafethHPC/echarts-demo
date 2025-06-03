const XLSX = require("xlsx");
const fs = require("fs");

// Read the teammates data
const teammatesData = JSON.parse(
  fs.readFileSync("./src/assets/teammates.json", "utf8")
);

// Extract unique locations
const uniqueLocations = new Map();

teammatesData.teammates.forEach((teammate) => {
  const key = `${teammate.city}|${teammate.state}|${teammate.country}`;
  if (!uniqueLocations.has(key)) {
    uniqueLocations.set(key, {
      CITY: teammate.city,
      STATENAME: teammate.state || "",
      COUNTRY_CODE: teammate.country,
    });
  }
});

// Convert to array
const locationsArray = Array.from(uniqueLocations.values());

console.log(`Found ${locationsArray.length} unique locations:`);
locationsArray.forEach((loc) => {
  console.log(`- ${loc.CITY}, ${loc.STATENAME}, ${loc.COUNTRY_CODE}`);
});

// Create XLSX file
const worksheet = XLSX.utils.json_to_sheet(locationsArray);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Locations");

// Write the file
XLSX.writeFile(workbook, "teammates-locations.xlsx");

console.log("\n✅ Created teammates-locations.xlsx");
console.log(
  "You can now run: node geocoding-script.js teammates-locations.xlsx teammates-geocoded.json"
);

// Also create a summary
const summary = {
  total_teammates: teammatesData.teammates.length,
  unique_locations: locationsArray.length,
  countries: [...new Set(teammatesData.teammates.map((t) => t.country))],
  locations_by_country: {},
};

// Group by country
teammatesData.teammates.forEach((teammate) => {
  if (!summary.locations_by_country[teammate.country]) {
    summary.locations_by_country[teammate.country] = new Set();
  }
  summary.locations_by_country[teammate.country].add(teammate.city);
});

// Convert sets to arrays for JSON serialization
Object.keys(summary.locations_by_country).forEach((country) => {
  summary.locations_by_country[country] = Array.from(
    summary.locations_by_country[country]
  );
});

fs.writeFileSync("teammates-summary.json", JSON.stringify(summary, null, 2));
console.log("📊 Created teammates-summary.json with location statistics");

module.exports = { locationsArray, summary };
