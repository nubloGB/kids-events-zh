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
  const facts = page.locator(".list-facts").first();
  await expect(facts).toBeVisible();
  await expect(facts.locator(".chip-when")).toBeVisible();
  await expect(facts.locator(".chip-age")).toBeVisible();
  await expect(facts.locator(".chip-place")).toBeVisible();
  await expect(facts.locator(".chip-kind")).toBeVisible();
  await expect(facts.locator(".list-facts__desc")).toBeVisible();
  const pageLink = page.locator(".list-row__panel a.event-action--primary").first();
  await expect(pageLink).toBeVisible();
  const linkBox = await pageLink.boundingBox();
  const actionsBox = await page.locator(".list-row__actions").first().boundingBox();
  expect(linkBox?.height ?? 0).toBeLessThanOrEqual(42);
  expect((linkBox?.width ?? 999) + 8).toBeLessThan(actionsBox?.width ?? 0);

  await page.getByRole("radio", { name: "Karty" }).click();
  await expect(page.locator(".event-card").first()).toBeVisible();
  await page.reload();
  await expect(page.locator(".event-card").first()).toBeVisible();

  await page.getByRole("radio", { name: "Mapa" }).click();
  await expect(page.locator(".event-map")).toBeVisible();
  await page.getByRole("radio", { name: "Lista" }).click();
  await expect(page.locator(".day-heading").first()).toContainText("Dziś");
});
