const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto("http://localhost:3000/product/foaming-clay-cleanser", {
    waitUntil: "networkidle",
    timeout: 60000,
  });

  const thumbs = page.locator('button[aria-label^="Select product image"]');
  console.log("thumbs", await thumbs.count());

  for (let i = 0; i < Math.min(3, await thumbs.count()); i++) {
    await thumbs.nth(i).click();
    await page.waitForTimeout(500);
    const info = await page.evaluate(() => {
      const img = document.querySelector("form .aspect-square img");
      const parent = img?.parentElement;
      const r = img?.getBoundingClientRect();
      return {
        nw: img?.naturalWidth,
        parentOpacity: parent ? getComputedStyle(parent).opacity : null,
        w: r ? Math.round(r.width) : null,
        h: r ? Math.round(r.height) : null,
      };
    });
    console.log("img", i, info);
  }

  const sizes = await page.locator("form dl dd button").allTextContents();
  const disabled = await page.locator("form dl dd button:disabled").count();
  const indicators = await page.locator("form dl dd button span.absolute").count();
  console.log({ sizes, disabled, indicators });

  // Click both sizes if enabled
  const buttons = page.locator("form dl dd button");
  for (let i = 0; i < (await buttons.count()); i++) {
    if (!(await buttons.nth(i).isDisabled())) {
      await buttons.nth(i).click();
      await page.waitForTimeout(250);
    }
  }
  console.log(
    "after clicks indicators",
    await page.locator("form dl dd button span.absolute").count()
  );

  await page.goto("http://localhost:3000/search", {
    waitUntil: "networkidle",
    timeout: 60000,
  });

  const card = page
    .locator(".group.relative.aspect-square")
    .filter({ hasText: "Foaming Clay" })
    .first();
  await card.scrollIntoViewIfNeeded();
  const chipTexts = await card.locator("button").evaluateAll((els) =>
    els
      .map((el) => (el.textContent || "").trim())
      .filter((t) => /ml/i.test(t) || t.length > 0)
  );
  console.log("catalog card buttons", chipTexts);
  console.log(
    "image dots",
    await card.locator('button[aria-label^="Show image"]').count()
  );
  await page.screenshot({ path: "public/qa/catalog-foaming.png" });

  await browser.close();
})();
