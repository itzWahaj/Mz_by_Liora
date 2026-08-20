const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/search", { waitUntil: "networkidle" });

  // Read RSC payload isn't easy; hit product page JSON via evaluate of storefront isn't available.
  // Instead open product and compare, then dump search HTML data attributes if any.
  const html = await page.content();
  console.log("has foaming", html.includes("Foaming Clay"));

  // Navigate to product and log via embedded next
  await page.goto("http://localhost:3000/product/foaming-clay-cleanser", {
    waitUntil: "networkidle",
  });

  // Fetch storefront via page from same origin - use the product page's visible state
  // Call an internal debug by evaluating nothing - instead request the page with RSC
  
  const res = await page.request.get(
    "http://localhost:3000/search?q=foaming"
  );
  console.log("search status", res.status());

  await browser.close();

  // Direct Shopify check would need env - read from .env.local in node
  require("dotenv").config({ path: ".env.local" });
})().catch(async (e) => {
  console.error(e.message);
  // fallback: use shopify from project
  const path = require("path");
  const fs = require("fs");
  const env = fs.readFileSync(".env.local", "utf8");
  const domain = (env.match(/SHOPIFY_STORE_DOMAIN=(.+)/) || [])[1]?.trim();
  const token = (env.match(/SHOPIFY_STOREFRONT_ACCESS_TOKEN=(.+)/) || [])[1]?.trim();
  console.log("domain", domain);
  const query = `
  query {
    product(handle: "foaming-clay-cleanser") {
      title
      options { name values }
      variants(first: 10) {
        edges { node { title availableForSale selectedOptions { name value } price { amount } } }
      }
    }
  }`;
  const r = await fetch(`https://${domain}/api/2024-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query }),
  });
  const j = await r.json();
  console.log(JSON.stringify(j.data?.product, null, 2));
});
