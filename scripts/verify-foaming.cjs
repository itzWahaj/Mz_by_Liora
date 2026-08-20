const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = process.env.QA_BASE_URL || "http://localhost:3000";
const OUT = path.join(process.cwd(), "public", "qa");
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const report = {};

  await page.goto(`${BASE}/product/foaming-clay-cleanser`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });

  const title = (await page.locator("h1").first().textContent())?.trim();
  report.title = title;
  report.url = page.url();

  // --- Gallery ---
  const thumbs = page.locator('button[aria-label="Select product image"]');
  const thumbCount = await thumbs.count();
  report.thumbCount = thumbCount;

  const gallery = {
    transitions: [],
  };

  if (thumbCount >= 3) {
    for (let i = 0; i < 3; i++) {
      const thumb = thumbs.nth(i);
      await thumb.click();
      await page.waitForTimeout(80);
      const midOpacity = await page
        .locator("form .aspect-square > div")
        .first()
        .evaluate((el) => getComputedStyle(el).opacity)
        .catch(() => null);
      await page.waitForTimeout(320);
      const imgSrc = await page
        .locator("form .aspect-square img")
        .first()
        .getAttribute("src");
      const activeStyle = await thumb.evaluate((el) => ({
        backgroundImage: getComputedStyle(el).backgroundImage,
        className: el.className,
      }));
      const inactiveStyles = [];
      for (let j = 0; j < thumbCount; j++) {
        if (j === i) continue;
        const bg = await thumbs.nth(j).evaluate((el) => getComputedStyle(el).backgroundImage);
        const opacityClass = await thumbs
          .nth(j)
          .locator("div")
          .first()
          .evaluate((el) => el.className)
          .catch(() => "");
        inactiveStyles.push({ j, backgroundImage: bg, opacityClass });
      }
      gallery.transitions.push({
        index: i,
        midOpacityDuringTransition: midOpacity,
        imgSrc: imgSrc?.slice(0, 120),
        activeBackgroundImage: activeStyle.backgroundImage,
        activeHasGradient:
          /gradient|linear-gradient/i.test(activeStyle.backgroundImage) &&
          activeStyle.backgroundImage !== "none",
        inactiveStyles,
      });
    }
    await page.screenshot({
      path: path.join(OUT, "foaming-gallery.png"),
      fullPage: false,
    });
  }
  report.gallery = gallery;

  // --- Variants ---
  const optionLabel = await page.locator("form dl dt").first().textContent().catch(() => null);
  const buttons = page.locator("form dl dd button");
  const optionCount = await buttons.count();
  report.optionLabel = optionLabel?.trim();
  report.optionCount = optionCount;

  const variants = [];
  for (let i = 0; i < optionCount; i++) {
    const btn = buttons.nth(i);
    const text = (await btn.textContent())?.trim();
    const disabled = await btn.isDisabled();
    const ariaDisabled = await btn.getAttribute("aria-disabled");
    const className = await btn.getAttribute("class");
    const styles = await btn.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        opacity: s.opacity,
        cursor: s.cursor,
        color: s.color,
      };
    });
    const hasIndicator = await btn.locator("span.absolute").count();
    variants.push({
      text,
      disabled,
      ariaDisabled,
      hasIndicator,
      opacity: styles.opacity,
      cursor: styles.cursor,
      className,
    });
  }
  report.variantsInitial = variants;

  // Click 150ml then 300ml (or first available then second)
  if (optionCount >= 2) {
    // Find 150ml / 300ml by text
    const texts = await buttons.allTextContents();
    const idx150 = texts.findIndex((t) => /150/i.test(t));
    const idx300 = texts.findIndex((t) => /300/i.test(t));

    if (idx150 >= 0) {
      await buttons.nth(idx150).click({ force: true }).catch(() => {});
      await page.waitForTimeout(250);
      const indicator150 = await buttons.nth(idx150).locator("span.absolute").count();
      const indicatorBox150 = indicator150
        ? await buttons.nth(idx150).locator("span.absolute").boundingBox()
        : null;
      report.after150 = { indicator150, indicatorBox150 };
    }

    if (idx300 >= 0) {
      // 300ml may be disabled — try click anyway for state
      const wasDisabled = await buttons.nth(idx300).isDisabled();
      if (!wasDisabled) {
        await buttons.nth(idx300).click();
        await page.waitForTimeout(300);
      }
      const indicator300 = await buttons.nth(idx300).locator("span.absolute").count();
      const box300 = await buttons.nth(idx300).boundingBox();
      const styles300 = await buttons.nth(idx300).evaluate((el) => {
        const s = getComputedStyle(el);
        return { opacity: s.opacity, cursor: s.cursor };
      });
      report.after300Attempt = {
        wasDisabled,
        indicator300,
        box300,
        styles300,
      };
    }

    // Slide check: click between two available if both available, else note
    const availableIdx = [];
    for (let i = 0; i < optionCount; i++) {
      if (!(await buttons.nth(i).isDisabled())) availableIdx.push(i);
    }
    if (availableIdx.length >= 2) {
      await buttons.nth(availableIdx[0]).click();
      await page.waitForTimeout(200);
      const boxA = await buttons
        .nth(availableIdx[0])
        .locator("span.absolute")
        .boundingBox();
      await buttons.nth(availableIdx[1]).click();
      await page.waitForTimeout(80);
      // mid-animation sample
      const midBoxes = [];
      for (let s = 0; s < 4; s++) {
        const box = await page
          .locator("form dl dd button span.absolute")
          .first()
          .boundingBox()
          .catch(() => null);
        midBoxes.push(box);
        await page.waitForTimeout(40);
      }
      await page.waitForTimeout(200);
      const boxB = await buttons
        .nth(availableIdx[1])
        .locator("span.absolute")
        .boundingBox();
      report.slide = { boxA, midBoxes, boxB, availableIdx };
    } else {
      report.slide = {
        note: "Only one available variant — cannot observe slide between two in-stock options",
        availableIdx,
      };
      // Still confirm indicator present on available and absent on OOS
      if (availableIdx.length === 1) {
        await buttons.nth(availableIdx[0]).click().catch(() => {});
        await page.waitForTimeout(200);
        report.indicatorOnAvailable = await buttons
          .nth(availableIdx[0])
          .locator("span.absolute")
          .count();
      }
    }
  }

  await page.screenshot({
    path: path.join(OUT, "foaming-variants.png"),
    fullPage: false,
  });

  // Scroll to show variants clearly — crop area around options
  const dd = page.locator("form dl dd").first();
  if ((await dd.count()) > 0) {
    await dd.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(OUT, "foaming-variants-close.png"),
    });
  }

  fs.writeFileSync(
    path.join(OUT, "foaming-verify.json"),
    JSON.stringify(report, null, 2)
  );
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})();
