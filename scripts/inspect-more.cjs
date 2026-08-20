const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.goto("http://localhost:3000/product/hydrating-vitamin-c-serum", {
    waitUntil: "networkidle",
  });
  const arrows = await page.locator('[aria-label="Next related products"]').count();
  const sb = await page.locator("ul.scrollbar-none").evaluate((el) => ({
    sw: el.scrollWidth,
    cw: el.clientWidth,
    overflow: el.scrollWidth > el.clientWidth,
  }));
  console.log({ arrows, sb });
  if (arrows) {
    await page.locator('[aria-label="Next related products"]').click();
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: "public/qa/related-mobile.png" });

  // Gallery crossfade can't run without multi images — confirm single image UI
  const nextImg = await page
    .locator('button[aria-label="Next product image"]')
    .count();
  console.log({ galleryNext: nextImg });

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  const missing = await page.evaluate(() => {
    return [...document.querySelectorAll("img")].map((img) => ({
      alt: img.alt,
      src: img.currentSrc || img.src,
      w: img.naturalWidth,
      complete: img.complete,
    })).filter((i) => i.complete && i.w === 0 && i.src);
  });
  console.log("broken images", missing);

  // Reduced motion: verify GSAP timeline not creating transforms on blobs
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
  });
  const rm = await ctx.newPage();
  await rm.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await rm.waitForTimeout(2000);
  const transforms = await rm.evaluate(() => {
    const hero = document.getElementById("home-hero");
    if (!hero) return [];
    return [...hero.querySelectorAll("[aria-hidden='true']")].slice(0, 5).map((el) => ({
      cls: (el.className || "").toString().slice(0, 60),
      transform: getComputedStyle(el).transform,
    }));
  });
  console.log("rm transforms after 2s", transforms);

  // Cart spring with reduced motion — measure x after open
  if (await rm.locator('[aria-label="Close cart"]').isVisible().catch(() => false)) {
    await rm.locator('[aria-label="Close cart"]').click();
    await rm.waitForTimeout(100);
  }
  const t0 = Date.now();
  await rm.locator('[aria-label="Open cart"]').click({ force: true });
  await rm.waitForTimeout(30);
  const asideEarly = await rm.locator("aside").first().evaluate((el) => {
    const t = getComputedStyle(el).transform;
    return { t, left: el.getBoundingClientRect().left };
  });
  await rm.waitForTimeout(50);
  const asideLate = await rm.locator("aside").first().evaluate((el) => {
    const t = getComputedStyle(el).transform;
    return { t, left: el.getBoundingClientRect().left };
  });
  console.log("cart open timing", { ms: Date.now() - t0, asideEarly, asideLate });

  await browser.close();
})();
