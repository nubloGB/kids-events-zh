import { expect, test } from "@playwright/test";

test("expanded Lista actions stay on one line at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.addInitScript(() => localStorage.setItem("kids-events-view", "lista"));
  await page.goto("/kids-events-zh/");
  await page.locator(".list-row").first().click();
  const actions = page.locator(".list-item.is-open .list-row__actions");
  await expect(actions.getByRole("link", { name: /Do wydarzenia/ })).toBeVisible();
  const line = await actions.evaluate((node) => {
    const tops = [...node.children].map((child) => child.getBoundingClientRect().top);
    return { spread: Math.max(...tops) - Math.min(...tops), overflow: node.scrollWidth - node.clientWidth };
  });
  expect(line.spread).toBeLessThan(8);
  expect(line.overflow).toBeLessThanOrEqual(1);
});
