import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("filter sheet, a date filter, a map popup, Lista, and Źródła", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("kids-events-view", "lista"));
  await page.goto("/kids-events-zh/");
  await page.locator(".phone-filter-button").click();
  await expect(page.getByRole("heading", { name: "Filtry" })).toBeVisible();
  await page.locator(".filters-sheet").getByRole("radio", { name: /Jutro/ }).click();
  await expect(page.locator(".sheet-results")).toContainText("Pokaż");
  await page.locator(".sheet-results").click();
  await page.locator(".day-slider__stop[data-stop='today']").click();

  await page.getByRole("radio", { name: "Mapa", exact: true }).click();
  await page.waitForSelector(".leaflet-container");
  await page.waitForFunction(() => !document.querySelector(".leaflet-zoom-anim"));
  const pin = page.locator(".pin-wrap").first();
  if (!(await pin.isVisible().catch(() => false))) {
    await page.locator(".cluster-pin").first().click();
    await page.waitForFunction(() => !document.querySelector(".leaflet-zoom-anim"));
    await expect(pin).toBeVisible();
  }
  await pin.click();
  if (!(await page.locator(".map-popup__route").isVisible().catch(() => false))) {
    await pin.click();
  }
  await expect(page.locator(".map-popup")).toBeVisible();
  await expect(page.locator(".map-popup__route")).toBeVisible();
  const route = await page.locator(".map-popup__route").evaluate((node) => getComputedStyle(node).color);
  expect(route).toBe("rgb(255, 255, 255)");
  const zoom = await page.locator(".leaflet-control-zoom-in").evaluate((node) => getComputedStyle(node).width);
  expect(zoom).toBe("44px");
  await expect(page.locator(".workspace")).toHaveAttribute("data-mobile-view", "mapa");

  await page.getByRole("radio", { name: "Lista" }).click();
  await expect(page.locator(".day-heading, .empty-panel").first()).toBeVisible();

  await page.goto("/kids-events-zh/#zrodla");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Źródła");
  await expect(page).toHaveTitle(/Źródła/);
});

test("axe on the home page and Źródła", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/kids-events-zh/");
  await page.waitForSelector(".list-table, .event-card, .empty-panel");
  const home = await new AxeBuilder({ page }).analyze();
  expect(home.violations, home.violations.map((item) => item.id).join(", ")).toEqual([]);

  await page.goto("/kids-events-zh/#zrodla");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Źródła");
  const sources = await new AxeBuilder({ page }).analyze();
  expect(sources.violations, sources.violations.map((item) => item.id).join(", ")).toEqual([]);
});
