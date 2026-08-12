import { expect, test } from "@playwright/test";

const pages = [
  ["home", "/"],
  ["publications", "/publications/"],
  ["life", "/life/"],
  ["baking", "/life/baking/?lang=zh"],
  ["craft", "/life/craft/?lang=zh"],
  ["hangzhou-routes", "/life/routes/?city=hangzhou&lang=zh"],
] as const;

for (const viewport of [
  { name: "mobile", width: 375, height: 812 },
  { name: "desktop", width: 1440, height: 1000 },
]) {
  for (const [name, path] of pages) {
    test(`${name} has a stable ${viewport.name} layout`, async ({ page }) => {
      const runtimeErrors: string[] = [];
      page.on("pageerror", (error) => runtimeErrors.push(error.message));
      await page.setViewportSize(viewport);
      await page.goto(path, { waitUntil: "networkidle" });
      await expect(page.locator("body")).toBeVisible();

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
      if (name === "hangzhou-routes") {
        await expect
          .poll(() =>
            page.locator(".leaflet-overlay-pane svg path").evaluateAll((paths) =>
              paths.some((path) => {
                try {
                  return (path as SVGPathElement).getTotalLength() > 20;
                } catch {
                  return false;
                }
              })
            )
          )
          .toBe(true);
      }
      expect(runtimeErrors).toEqual([]);
    });
  }
}
