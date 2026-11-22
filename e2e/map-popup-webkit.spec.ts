import { expect, test, webkit } from "@playwright/test";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

test("the map popup opens on the first tap and fits four icon buttons", async () => {
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
  if ((await page.locator(".pin-wrap").count()) === 0) {
    await page.locator(".cluster-pin").first().tap();
    await page.locator(".pin-wrap").first().waitFor();
  }
  await page.locator(".pin-wrap").first().tap();
  const popup = page.locator(".map-popup");
  await expect(popup).toBeVisible();
  await expect(popup.getByRole("link", { name: "Strona wydarzenia" })).toBeVisible();
  await expect(popup.getByRole("button", { name: "Trasa" })).toBeVisible();
  await expect(popup.getByRole("button", { name: /kalendarza/i })).toBeVisible();
  await expect(popup.getByRole("button", { name: "Pokaż na liście" })).toBeVisible();
  const box = await popup.boundingBox();
  expect(box?.width ?? 999).toBeLessThanOrEqual(390 - 16);
  await browser.close();
});
