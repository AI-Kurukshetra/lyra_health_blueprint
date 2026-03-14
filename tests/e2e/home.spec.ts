import { expect, test } from "@playwright/test";

test("home page shows platform title", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Lyra Health Platform")).toBeVisible();
});

