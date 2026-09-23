import { test, expect } from "@playwright/test";

test("demo flow: sample brief, clause, and compare", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
  await page.getByRole("button", { name: "Load sample employment agreement" }).click();
  await expect(page.getByRole("heading", { name: "Document Brief" })).toBeVisible();
  await expect(page.getByText("Employment Agreement")).toBeVisible();
  await page.getByRole("button", { name: /Section 9/ }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("What the document says")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("link", { name: "Compare" }).click();
  await page.getByRole("button", { name: /Load sample version B/ }).click();
  await expect(page.getByText(/Changed/)).toBeVisible();
});
