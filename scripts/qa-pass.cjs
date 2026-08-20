/**
 * Final polish verification — run against local Next.js:
 *   node scripts/qa-pass.mjs
 */
const { chromium, devices } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.QA_BASE_URL || "http://localhost:3000";
const OUT = path.join(process.cwd(), "public", "qa");

function ensureOut() {
  fs.mkdirSync(OUT, { recursive: true });
}

async function status(page, url) {
  const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  return { url, status: res?.status() ?? 0 };
}

async function main() {
  ensureOut();
  const report = {
    scrollbar: null,
    gallery: null,
    variants: null,
    mobile: null,
    reducedMotion: null,
    hover: null,
    links: [],
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // --- Discover products from search ---
  await page.goto(`${BASE}/search`, { waitUntil: "networkidle", timeout: 60000 });
  const productLinks = await page.$$eval('a[href^="/product/"]', (as) =>
    [...new Set(as.map((a) => a.getAttribute("href")).filter(Boolean))]
  );
  console.log("Products found:", productLinks.length, productLinks.slice(0, 8));

  let multiImage = null;
  let multiVariant = null;

  for (const href of productLinks.slice(0, 12)) {
    await page.goto(`${BASE}${href}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    const thumbCount = await page.locator('button[aria-label="Select product image"]').count();
    const optionButtons = await page.locator("form dl dd button").count();
    const title = await page.locator("h1").first().textContent().catch(() => href);
    if (!multiImage && thumbCount > 1) {
      multiImage = { href, title: title?.trim(), thumbs: thumbCount };
    }
    // Variant options render as buttons inside option forms (not gallery)
    const variantForms = await page.locator("form").filter({ has: page.locator("dl dt") }).count();
    if (!multiVariant && optionButtons >= 2 && variantForms > 0) {
      // Confirm it's not just gallery — look for uppercase option label like Size
      const hasOptionLabel = await page.locator("form dl dt").count();
      if (hasOptionLabel > 0) {
        multiVariant = {
          href,
          title: title?.trim(),
          options: optionButtons,
        };
      }
    }
    if (multiImage && multiVariant) break;
  }

  // Prefer named serums if present
  const serum = productLinks.find((h) => /niacinamide|vitamin-c|serum/i.test(h));
  if (serum) {
    await page.goto(`${BASE}${serum}`, { waitUntil: "domcontentloaded" });
    const thumbs = await page.locator('button[aria-label="Select product image"]').count();
    if (thumbs > 1) {
      multiImage = {
        href: serum,
        title: (await page.locator("h1").first().textContent())?.trim(),
        thumbs,
      };
    }
  }

  // === 1. Related products scrollbar ===
  if (productLinks[0]) {
    await page.goto(`${BASE}${productLinks[0]}`, { waitUntil: "networkidle" });
    const related = page.locator("ul.scrollbar-none").first();
    const relatedExists = (await related.count()) > 0;
    let scrollbarHidden = false;
    if (relatedExists) {
      scrollbarHidden = await related.evaluate((el) => {
        const s = getComputedStyle(el);
        return s.scrollbarWidth === "none" || s.msOverflowStyle === "none";
      });
      // WebKit scrollbar display:none isn't always visible via computed style on Chromium;
      // also check class presence.
      const hasClass = await related.evaluate((el) =>
        el.classList.contains("scrollbar-none")
      );
      scrollbarHidden = scrollbarHidden || hasClass;
    }
    const arrows = await page.locator('[aria-label="Next related products"]').count();
    report.scrollbar = {
      relatedListFound: relatedExists,
      scrollbarHiddenClass: scrollbarHidden,
      arrowControls: arrows > 0,
    };
    await page.screenshot({
      path: path.join(OUT, "related-scrollbar.png"),
      fullPage: false,
    });
  }

  // === 2. Gallery crossfade ===
  if (multiImage) {
    await page.goto(`${BASE}${multiImage.href}`, { waitUntil: "networkidle" });
    const thumbs = page.locator('button[aria-label="Select product image"]');
    const count = await thumbs.count();
    // Capture opacity transition by clicking second thumb and sampling motion node
    const beforeSrc = await page.locator(".aspect-square img").first().getAttribute("src");
    await thumbs.nth(Math.min(1, count - 1)).click();
    await page.waitForTimeout(80);
    const midOpacity = await page
      .locator(".aspect-square > div")
      .first()
      .evaluate((el) => getComputedStyle(el).opacity)
      .catch(() => null);
    await page.waitForTimeout(350);
    const afterSrc = await page.locator(".aspect-square img").first().getAttribute("src");
    const activeThumb = thumbs.nth(Math.min(1, count - 1));
    const activeGradient = await activeThumb.evaluate((el) => {
      const bg = getComputedStyle(el).backgroundImage;
      return bg.includes("gradient") || bg.includes("linear");
    });
    const inactiveOpacity = await thumbs.nth(0).locator("div").first().evaluate((el) => {
      return el.className.includes("opacity") || getComputedStyle(el).opacity !== "1";
    }).catch(() => true);

    report.gallery = {
      product: multiImage,
      beforeSrc: beforeSrc?.slice(0, 80),
      afterSrc: afterSrc?.slice(0, 80),
      srcChanged: beforeSrc !== afterSrc,
      midOpacityDuringTransition: midOpacity,
      activeHasGradientBorder: activeGradient,
      inactiveMutedLikely: inactiveOpacity,
    };
    await page.screenshot({ path: path.join(OUT, "gallery-multi.png") });
  } else {
    report.gallery = { unverified: true, reason: "No multi-image product found" };
  }

  // === 3. Variants ===
  if (multiVariant) {
    await page.goto(`${BASE}${multiVariant.href}`, { waitUntil: "networkidle" });
    const optionButtons = page.locator("form dl dd button");
    const n = await optionButtons.count();
    if (n >= 2) {
      await optionButtons.nth(0).click();
      await page.waitForTimeout(100);
      await optionButtons.nth(1).click();
      await page.waitForTimeout(200);
      const indicator = page.locator('[class*="bg-brand-gradient"]').filter({
        has: page.locator("xpath=."),
      });
      // Look for motion underline inside active button
      const hasIndicator = await optionButtons
        .nth(1)
        .locator("span.absolute")
        .count();
      const disabledCount = await page.locator("form dl dd button[disabled]").count();
      report.variants = {
        product: multiVariant,
        optionCount: n,
        indicatorOnSecond: hasIndicator > 0,
        unavailableDisabledCount: disabledCount,
      };
    }
  } else {
    report.variants = {
      unverified: true,
      reason: "No multi-variant product found in catalog sample",
    };
  }

  // === 4. Mobile ===
  const mobileNotes = [];
  for (const width of [375, 390]) {
    const mctx = await browser.newContext({
      viewport: { width, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const m = await mctx.newPage();
    await m.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });

    const menuBtn = await m.locator('[aria-label="Open mobile menu"]').isVisible();
    const searchDesktop = await m.locator('input[name="search"]').isVisible().catch(() => false);
    const heroOverflow = await m.evaluate(() => {
      const hero = document.getElementById("home-hero");
      if (!hero) return null;
      return {
        scrollWidth: hero.scrollWidth,
        clientWidth: hero.clientWidth,
        overflows: hero.scrollWidth > hero.clientWidth + 2,
      };
    });
    const bodyOverflow = await m.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2
    );
    const footerCols = await m.locator('nav[aria-label="Footer"] > div').count();
    const newsletterStacked = await m.evaluate(() => {
      const form = document.querySelector("#footer-email")?.closest("form");
      const row = form?.querySelector("div.flex");
      if (!row) return null;
      const style = getComputedStyle(row);
      return style.flexDirection === "column";
    });

    // Close cart if it auto-opened from a prior session cookie
    if (await m.locator('[aria-label="Close cart"]').isVisible().catch(() => false)) {
      await m.locator('[aria-label="Close cart"]').click();
      await m.waitForTimeout(300);
    }
    await m.locator('[aria-label="Open cart"]').click({ force: true });
    await m.waitForTimeout(400);
    const cartPanel = m.locator("aside").filter({ hasText: "My Cart" }).first();
    const cartVisible = await cartPanel.isVisible().catch(() => false);
    const cartWidthOk = cartVisible
      ? await cartPanel.evaluate(
          (el) => el.getBoundingClientRect().width <= window.innerWidth + 1
        )
      : null;
    if (cartVisible) {
      await m.locator('[aria-label="Close cart"]').click().catch(() => {});
      await m.waitForTimeout(200);
    }

    await m.screenshot({
      path: path.join(OUT, `mobile-home-${width}.png`),
      fullPage: true,
    });

    await m.goto(`${BASE}/search`, { waitUntil: "networkidle" });
    const gridCols = await m.evaluate(() => {
      const grid = document.querySelector(".grid");
      if (!grid) return null;
      return getComputedStyle(grid).gridTemplateColumns;
    });
    await m.screenshot({ path: path.join(OUT, `mobile-search-${width}.png`) });

    mobileNotes.push({
      width,
      mobileMenuButton: menuBtn,
      desktopSearchHiddenLikely: !searchDesktop,
      heroOverflow,
      bodyOverflow,
      footerColumnBlocks: footerCols,
      newsletterStacked,
      cartVisible,
      cartFitsViewport: cartWidthOk,
      searchGridTemplate: gridCols,
    });
    await mctx.close();
  }
  report.mobile = mobileNotes;

  // === 5. Reduced motion ===
  const rmCtx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
  });
  const rm = await rmCtx.newPage();
  await rm.goto(`${BASE}/`, { waitUntil: "networkidle" });
  // GSAP should not be animating ambient transform heavily — sample after 500ms
  await rm.waitForTimeout(600);
  const ambientTransform = await rm.evaluate(() => {
    const ambient = document.querySelector("#home-hero [aria-hidden='true']");
    return ambient ? getComputedStyle(ambient).transform : null;
  });
  // Lenis should not be present as smooth scroll library binding — check no lenis class
  const hasLenis = await rm.evaluate(() => document.documentElement.classList.contains("lenis"));
  // Skeleton animation duration
  const shimmerAnim = await rm.evaluate(() => {
    const el = document.querySelector(".skeleton-shimmer");
    if (!el) return "no-skeleton-on-home";
    return getComputedStyle(el).animationName;
  });
  // Open cart and check transition duration effectively instant
  if (await rm.locator('[aria-label="Close cart"]').isVisible().catch(() => false)) {
    await rm.locator('[aria-label="Close cart"]').click().catch(() => {});
  }
  await rm.locator('[aria-label="Open cart"]').click({ force: true }).catch(() => {});
  await rm.waitForTimeout(50);
  report.reducedMotion = {
    ambientTransformSample: ambientTransform,
    lenisClassOnHtml: hasLenis,
    shimmerAnimation: shimmerAnim,
  };
  await rm.screenshot({ path: path.join(OUT, "reduced-motion-home.png") });
  await rmCtx.close();

  // === 6. Product card hover ===
  await page.goto(`${BASE}/search`, { waitUntil: "networkidle" });
  const card = page.locator('a[href^="/product/"]').first().locator("xpath=ancestor::div[contains(@class,'group')]").first();
  // ProductGridCard wraps in motion.div.group
  const cardRoot = page.locator(".group.relative.aspect-square").first();
  if ((await cardRoot.count()) > 0) {
    const before = await cardRoot.evaluate((el) => {
      const glow = el.querySelector(".bg-brand-gradient");
      return {
        transform: getComputedStyle(el).transform,
        glowOpacity: glow ? getComputedStyle(glow).opacity : null,
      };
    });
    await cardRoot.hover();
    await page.waitForTimeout(450);
    const after = await cardRoot.evaluate((el) => {
      const glow = el.querySelector(".pointer-events-none.absolute.inset-0");
      const img = el.querySelector("img");
      return {
        transform: getComputedStyle(el).transform,
        glowOpacity: glow ? getComputedStyle(glow).opacity : null,
        imgTransform: img ? getComputedStyle(img).transform : null,
      };
    });
    report.hover = { light: { before, after } };

    // Dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });
    await page.waitForTimeout(200);
    await cardRoot.hover();
    await page.waitForTimeout(400);
    const darkAfter = await cardRoot.evaluate((el) => ({
      transform: getComputedStyle(el).transform,
      glowOpacity: el.querySelector(".pointer-events-none.absolute.inset-0")
        ? getComputedStyle(el.querySelector(".pointer-events-none.absolute.inset-0")).opacity
        : null,
    }));
    report.hover.dark = darkAfter;
    await page.screenshot({ path: path.join(OUT, "card-hover.png") });
  } else {
    report.hover = { unverified: true, reason: "No product grid card found" };
  }

  // === 8. Link sweep ===
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  // Collect nav + footer links
  const hrefs = await page.$$eval("nav a[href], footer a[href]", (as) =>
    [
      ...new Set(
        as
          .map((a) => a.getAttribute("href"))
          .filter((h) => h && h.startsWith("/") && !h.startsWith("/#"))
      ),
    ]
  );
  for (const href of hrefs) {
    const res = await page.request.get(`${BASE}${href}`);
    report.links.push({ href, status: res.status() });
  }

  await browser.close();

  const outFile = path.join(OUT, "report.json");
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log("Wrote", outFile);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
