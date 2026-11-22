import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 360, height: 800 } });

test("slider drag, label, arrow keys, and the filter sheet stay in sync", async ({ page }) => {
  await page.goto("/kids-events-zh/");
  await expect(page.locator(".day-slider__stop[data-stop='today']")).toHaveAttribute("aria-checked", "true");

  const thumb = page.locator(".day-slider__thumb");
  const box = await thumb.boundingBox();
  if (!box) throw new Error("Brak suwaka");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 90, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator(".day-slider__stop[aria-checked='true']")).not.toHaveAttribute("data-stop", "today");

  await page.locator(".day-slider__caption", { hasText: "Dziś" }).click();
  await expect(page.locator(".day-slider__stop[data-stop='today']")).toHaveAttribute("aria-checked", "true");
  await page.locator(".day-slider__stop[aria-checked='true']").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".day-slider__stop[data-stop='tomorrow']")).toHaveAttribute("aria-checked", "true");

  await page.locator(".phone-filter-button").click();
  await expect(page.locator('[aria-label="Data"] [aria-checked="true"]')).toContainText("Jutro");
  await page.getByRole("radio", { name: /Inny zakres/ }).click();
  await page.locator('.date-popover input[type="date"]').nth(0).fill("2026-12-12");
  await page.locator('.date-popover input[type="date"]').nth(1).fill("2026-12-18");
  await page.locator(".sheet-results").click();
  await expect(page.locator(".day-slider__bubble")).toContainText("Własny: 12–18.12");
  await expect(page.locator(".day-slider__thumb")).toHaveCount(0);

  await page.locator(".phone-filter-button").click();
  await page.locator(".sheet-clear").click();
  await expect(page.locator('[aria-label="Rodzaj"] [aria-checked="true"]')).toHaveText("Jednodniowe");
  await expect(page.locator('[aria-label="Data"] [aria-checked="true"]')).toContainText("Dziś");
  await page.locator(".sheet-results").click();
  await expect(page.locator(".day-slider__stop[data-stop='today']")).toHaveAttribute("aria-checked", "true");
  await expect(page).toHaveURL(/\/kids-events-zh\/?(#.*)?$/);
});
