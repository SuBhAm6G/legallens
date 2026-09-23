import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility (Axe)", () => {
  test("Home/Ingest page should not have any automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/");
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  // Note: For other pages, we would ideally mock the session context and document data
  // to fully test the rendered output. Testing the home page verifies the shell (header, layout, main tags).
});
