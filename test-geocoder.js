const LocationGeocoder = require("./geocoding-script");
const XLSX = require("xlsx");
const fs = require("fs");

// Create a sample XLSX file for testing
function createSampleXLSX() {
  const sampleData = [
    { CITY: "New York", STATENAME: "NY", COUNTRY_CODE: "US" },
    { CITY: "London", STATENAME: "", COUNTRY_CODE: "GB" },
    { CITY: "Tokyo", STATENAME: "", COUNTRY_CODE: "JP" },
    { CITY: "Paris", STATENAME: "", COUNTRY_CODE: "FR" },
    { CITY: "Los Angeles", STATENAME: "CA", COUNTRY_CODE: "US" },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Locations");

  XLSX.writeFile(workbook, "sample-locations.xlsx");
  console.log("Created sample-locations.xlsx");
}

// Test the geocoder
async function testGeocoder() {
  console.log("Creating sample XLSX file...");
  createSampleXLSX();

  console.log("\nTesting geocoder...");
  const geocoder = new LocationGeocoder();

  // Test individual geocoding
  console.log("\n--- Testing individual geocoding ---");
  const testLocation = await geocoder.geocodeLocation("Berlin", "", "DE");
  console.log("Berlin, DE:", testLocation);

  // Test full file processing
  console.log("\n--- Testing full file processing ---");
  await geocoder.run("sample-locations.xlsx", "test-output.json");

  // Display results
  if (fs.existsSync("test-output.json")) {
    const results = JSON.parse(fs.readFileSync("test-output.json", "utf8"));
    console.log("\n--- Sample Results ---");
    console.log(JSON.stringify(results, null, 2));
  }
}

if (require.main === module) {
  testGeocoder().catch(console.error);
}
