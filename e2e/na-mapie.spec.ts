import { expect, test, webkit, type Page } from "@playwright/test";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

async function openEventOnMap(page: Page, gesture: "click" | "tap" = "click") {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem("kids-events-view", "lista");
  });
  await page.goto("/kids-events-zh/");
  const row = page.locator(".list-row").first();
  await row.click();
  const title = (await row.locator(".list-row__title").innerText()).trim();
  const mapButton = page.locator(".list-item.is-open").getByRole("button", { name: "Pokaż na mapie" });
  await mapButton.scrollIntoViewIfNeeded();
  await expect(mapButton).toBeVisible();
  if (gesture === "tap") await mapButton.tap();
  else await mapButton.click();
  await expect(page.locator(".workspace")).toHaveAttribute("data-mobile-view", "mapa");
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.locator(".map-popup__title")).toContainText(title);
}

test("Na mapie opens that event on the map", async ({ page }) => {
  await openEventOnMap(page);
});

test("Na mapie opens that event on the map in WebKit", async () => {
  const browser = await webkit.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: IPHONE,
  });
  const page = await context.newPage();
  await openEventOnMap(page, "tap");
  await browser.close();
});
