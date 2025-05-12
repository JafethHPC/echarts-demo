const { chromium } = require("playwright");

(async () => {
  console.log("Starting Playwright test for tree diagram...");
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the app
  console.log("Navigating to the application...");
  await page.goto("http://localhost:4200/");

  // Wait for the chart to load
  console.log("Waiting for chart to load...");
  await page.waitForSelector(".chart-container");

  // Take a screenshot of the initial view
  console.log("Taking initial screenshot...");
  await page.screenshot({ path: "tree-diagram-initial.png", fullPage: true });

  // Resize the viewport to a smaller size to test centering
  console.log("Resizing viewport to test centering...");
  await page.setViewportSize({ width: 800, height: 600 });

  // Wait for chart to adjust
  await new Promise((r) => setTimeout(r, 1000));

  // Take a screenshot of the resized view
  console.log("Taking resized screenshot...");
  await page.screenshot({ path: "tree-diagram-resized.png", fullPage: true });

  console.log("Test completed. Screenshots saved.");

  // Keep browser open for manual inspection
  console.log(
    "Browser will remain open for 10 seconds for manual inspection..."
  );
  await new Promise((r) => setTimeout(r, 10000));

  await browser.close();
})();
