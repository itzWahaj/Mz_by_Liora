const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto("http://localhost:3000/product/foaming-clay-cleanser", {
    waitUntil: "networkidle",
  });

  const thumbs = page.locator('button[aria-label="Select product image"]');

  for (let i = 0; i < 3; i++) {
    await thumbs.nth(i).click();
    await page.waitForTimeout(450);
    const info = await page.evaluate(() => {
      const img = document.querySelector("form .aspect-square img");
      if (!img) return { missing: true };
      const r = img.getBoundingClientRect();
      const s = getComputedStyle(img);
      return {
        src: (img.currentSrc || img.src).slice(0, 100),
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        opacity: s.opacity,
        visibility: s.visibility,
        display: s.display,
        rect: {
          w: Math.round(r.width),
          h: Math.round(r.height),
          top: Math.round(r.top),
        },
        parentOpacity: getComputedStyle(img.parentElement).opacity,
      };
    });
    const thumbBg = await thumbs.nth(i).evaluate((el) =>
      getComputedStyle(el).backgroundImage.includes("gradient")
    );
    const inactiveOpacities = await thumbs.evaluateAll((els, active) =>
      els.map((el, idx) => {
        const img = el.querySelector("img");
        return {
          idx,
          active: idx === active,
          imgOpacity: img ? getComputedStyle(img).opacity : null,
          imgClass: img?.className?.includes("opacity-70") || false,
        };
      }), i);
    console.log(JSON.stringify({ i, info, thumbBg, inactiveOpacities }, null, 2));
    await page.screenshot({
      path: `public/qa/foaming-img-${i}.png`,
      clip: { x: 16, y: 80, width: 700, height: 700 },
    });
  }

  await browser.close();
})();
