import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 360, height: 800 } });

test("Lista is the default, a row expands, and another view is remembered", async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("e2e-view-ready")) return;
    localStorage.removeItem("kids-events-view");
    sessionStorage.setItem("e2e-view-ready", "1");
  });
  await page.goto("/kids-events-zh/");
  await expect(page.locator(".day-heading").first()).toContainText("Dziś");
  const row = page.locator(".list-row").first();
  await expect(row).toBeVisible();
  await row.click();
  await expect(row).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".list-row__actions").first()).toBeVisible();

  await page.getByRole("radio", { name: "Karty" }).click();
  await expect(page.locator(".event-card").first()).toBeVisible();
  await page.reload();
  await expect(page.locator(".event-card").first()).toBeVisible();

  await page.getByRole("radio", { name: "Mapa" }).click();
  await expect(page.locator(".event-map")).toBeVisible();
  await page.getByRole("radio", { name: "Lista" }).click();
  await expect(page.locator(".day-heading").first()).toContainText("Dziś");
});
