const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto("http://localhost:3000/search", { waitUntil: "networkidle" });

  const card = page
    .locator(".group.relative.aspect-square")
    .filter({ hasText: "Foaming Clay" })
    .first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();

  const before = await card.locator("p").filter({ hasText: "USD" }).first().textContent();
  const btn300 = card.getByRole("button", { name: "300ml", exact: true });
  console.log({
    disabled: await btn300.isDisabled(),
    title: await btn300.getAttribute("title"),
  });

  await btn300.click();
  await page.waitForTimeout(350);
  const after = await card.locator("p").filter({ hasText: "USD" }).first().textContent();
  const active300 = await btn300.evaluate((el) =>
    el.className.includes("bg-brand-gradient")
  );
  const arrows = await card.locator("button[aria-label^='Next image']").count();
  const prev = await card.locator("button[aria-label^='Previous image']").count();

  console.log({ before, after, active300, arrows, prev });
  await page.screenshot({ path: "public/qa/catalog-300ml.png" });
  await browser.close();
})();
