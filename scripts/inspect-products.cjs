const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const handles = [
    "niacinamide-pore-refining-serum",
    "hydrating-vitamin-c-serum",
    "mz-by-liora-essentials-set",
    "oil-free-gel-moisturizer",
    "ceramide-repair-moisturizer",
    "overnight-recovery-sleep-mask",
    "gentle-hydrating-cleanser",
    "foaming-clay-cleanser",
  ];

  for (const h of handles) {
    await page.goto("http://localhost:3000/product/" + h, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    const thumbs = await page
      .locator('button[aria-label="Select product image"]')
      .count();
    const opts = await page.locator("form dl dt").allTextContents();
    const title = (await page.locator("h1").first().textContent())?.trim();
    const relatedArrows = await page
      .locator('[aria-label="Next related products"]')
      .count();
    const relatedItems = await page.locator("ul.scrollbar-none > li").count();
    console.log(
      JSON.stringify({ h, title, thumbs, opts, relatedArrows, relatedItems })
    );
  }

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  const overflow = await page.evaluate(() => {
    const hero = document.getElementById("home-hero");
    const offenders = [];
    if (!hero) return null;
    for (const el of hero.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.right > window.innerWidth + 2 || r.left < -2) {
        offenders.push({
          tag: el.tagName,
          cls: (el.className || "").toString().slice(0, 100),
          left: Math.round(r.left),
          right: Math.round(r.right),
        });
      }
    }
    return {
      docOverflow: document.documentElement.scrollWidth - window.innerWidth,
      heroOverflowHidden: getComputedStyle(hero).overflow,
      offenders: offenders.slice(0, 15),
    };
  });
  console.log("overflow", JSON.stringify(overflow, null, 2));

  // Force gallery test: count images from Shopify-rendered img srcs in gallery
  await page.goto(
    "http://localhost:3000/product/hydrating-vitamin-c-serum",
    { waitUntil: "networkidle" }
  );
  const galleryHtml = await page.locator("form").first().innerHTML();
  console.log("vitamin-c gallery has thumb buttons:", await page.locator('button[aria-label="Select product image"]').count());
  console.log("gallery arrow buttons:", await page.locator('button[aria-label="Next product image"]').count());

  await browser.close();
})();
