import { expect, test, webkit } from "@playwright/test";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

test("Pokaż na liście expands that row in WebKit", async () => {
  const browser = await webkit.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: IPHONE,
  });
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.setItem("kids-events-view", "mapa"));
  await page.goto("/kids-events-zh/");
  await page.waitForSelector(".pin-wrap, .cluster-pin");
  if ((await page.locator(".pin-wrap").count()) === 0) await page.locator(".cluster-pin").first().tap();
  await page.locator(".pin-wrap").first().tap();
  const popupTitle = page.locator(".map-popup__title");
  await expect(popupTitle).toBeVisible();
  const title = (await popupTitle.innerText()).trim();
  await page.getByRole("button", { name: "Pokaż na liście" }).tap();
  await expect(page.locator(".workspace")).toHaveAttribute("data-mobile-view", "lista");
  const row = page.locator(".list-item.is-open", { hasText: title });
  await expect(row).toBeVisible();
  const box = await row.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeLessThan(844);
  expect(box!.y + Math.min(box!.height, 80)).toBeGreaterThan(0);
  await browser.close();
});
