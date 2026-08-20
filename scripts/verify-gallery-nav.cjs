const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto("http://localhost:3000/product/foaming-clay-cleanser", {
    waitUntil: "networkidle",
  });

  const getSrc = () =>
    page.locator("form .aspect-square img, .aspect-square img").first().getAttribute("src");

  // Gallery may no longer be in a form
  const mainImg = page.locator(".aspect-square img").first();
  await mainImg.waitFor({ state: "visible" });
  const src0 = await mainImg.getAttribute("src");

  await page.locator('[aria-label="Next product image"]').click();
  await page.waitForTimeout(450);
  const src1 = await page.locator(".aspect-square img").first().getAttribute("src");

  await page.locator('[aria-label="Select product image 3"]').click();
  await page.waitForTimeout(450);
  const src2 = await page.locator(".aspect-square img").first().getAttribute("src");

  const thumbOverflow = await page.locator("ul").filter({ has: page.locator('[aria-label^="Select product image"]') }).evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      overflow: s.overflow,
      overflowY: s.overflowY,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    };
  });

  // Size selection (scope to the Size section)
  const sizeSection = page.locator("div").filter({ has: page.getByText("Size", { exact: true }) }).last();
  const size150 = sizeSection.getByRole("button", { name: "150ml", exact: true });
  const size300 = sizeSection.getByRole("button", { name: "300ml", exact: true });
  await size150.click();
  await page.waitForTimeout(200);
  const pressed150 = await size150.getAttribute("aria-pressed");
  await size300.click();
  await page.waitForTimeout(200);
  const pressed300 = await size300.getAttribute("aria-pressed");
  const class150 = await size150.getAttribute("class");
  const class300 = await size300.getAttribute("class");

  console.log(
    JSON.stringify(
      {
        srcChangedNext: src0 !== src1,
        srcChangedThumb3: src1 !== src2,
        src0: src0?.slice(0, 60),
        src1: src1?.slice(0, 60),
        src2: src2?.slice(0, 60),
        thumbOverflow,
        pressed150,
        pressed300,
        active150: class150?.includes("bg-brand-gradient"),
        active300: class300?.includes("bg-brand-gradient"),
      },
      null,
      2
    )
  );

  await page.screenshot({ path: "public/qa/gallery-nav-fixed.png" });
  await browser.close();
})();
