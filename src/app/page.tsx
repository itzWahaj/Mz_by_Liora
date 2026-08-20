export const runtime = "edge";

import clsx from "clsx";
import Grid from "@/components/grid";
import HomeHero from "@/components/home/hero";
import ProductGridItems from "@/components/layout/product-grid-items";
import { RevealItem, RevealStagger } from "@/components/ui/reveal";
import { BRAND, HOMEPAGE_COLLECTIONS } from "@/lib/constants";
import { getCollectionProducts } from "@/lib/shopify";
import Link from "next/link";

export const metadata = {
  description: BRAND.metaDescription,
  openGraph: {
    type: "website" as const,
  },
};

/** Full desktop row is 4 cards; fewer than that looks sparse left-aligned. */
const HOMEPAGE_GRID_COLUMNS = 4;

function collectionGridClassName(productCount: number) {
  if (productCount >= HOMEPAGE_GRID_COLUMNS) {
    return "w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  }

  // Center a narrower grid so 1–3 cards don't leave empty columns on the right.
  return clsx(
    "mx-auto w-full justify-items-stretch",
    productCount === 1 && "max-w-sm grid-cols-1",
    productCount === 2 && "max-w-3xl grid-cols-1 sm:grid-cols-2",
    productCount === 3 && "max-w-5xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
  );
}

export default async function Home() {
  const collections = await Promise.all(
    HOMEPAGE_COLLECTIONS.map(async (collection) => ({
      ...collection,
      products: (
        await getCollectionProducts({ collection: collection.handle })
      ).slice(0, 4),
    }))
  );

  const sale = collections.find(
    (collection) =>
      (collection.handle as string) === "sale" && collection.products.length > 0
  );

  const heroProduct =
    collections.find((collection) => collection.products.length > 0)
      ?.products[0] ?? null;
  const heroImage = heroProduct
    ? {
        url:
          heroProduct.featuredImage?.url ||
          heroProduct.images[0]?.url ||
          "",
        alt: heroProduct.title,
      }
    : null;

  return (
    <main className="flex-1">
      <HomeHero
        title={BRAND.tagline}
        description={`${BRAND.description} Discover rituals that treat the skin with care beyond standards.`}
        collections={HOMEPAGE_COLLECTIONS}
        image={heroImage?.url ? heroImage : null}
      />

      {collections.map((collection) => {
        const productCount = collection.products.length;

        // Hide empty sections instead of an unbalanced row or placeholder.
        if (productCount === 0) {
          return null;
        }

        return (
          <section key={collection.handle} className="w-full py-12 md:py-14">
            <div className="mx-auto w-full max-w-7xl space-y-8 px-4 md:px-6">
              <RevealStagger className="flex w-full flex-col items-center justify-center space-y-3 text-center">
                <RevealItem>
                  <Link
                    href={collection.href}
                    prefetch={false}
                    className="group/title relative inline-flex flex-col items-center"
                  >
                    <h2 className="font-display text-3xl font-bold tracking-tight text-brand transition-brand group-hover/title:-translate-y-0.5 group-hover/title:text-brand-blue dark:text-white dark:group-hover/title:text-brand-teal-light sm:text-4xl">
                      {collection.title}
                    </h2>
                    <span
                      aria-hidden
                      className="mt-2 h-[3px] w-16 origin-center scale-x-0 rounded-full bg-brand-gradient transition-transform duration-300 ease-out group-hover/title:scale-x-100"
                    />
                  </Link>
                </RevealItem>
                <RevealItem>
                  <Link
                    href={collection.href}
                    className="group/link relative inline-flex items-center overflow-hidden rounded-full px-4 py-1.5 text-sm font-medium text-neutral-600 transition-brand hover:text-white dark:text-neutral-400 dark:hover:text-white"
                    prefetch={false}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-0 origin-left scale-x-0 rounded-full bg-brand-gradient opacity-0 transition-all duration-300 ease-out group-hover/link:scale-x-100 group-hover/link:opacity-100"
                    />
                    <span className="relative z-10">View all</span>
                  </Link>
                </RevealItem>
              </RevealStagger>
              <Grid className={collectionGridClassName(productCount)}>
                <ProductGridItems products={collection.products} />
              </Grid>
            </div>
          </section>
        );
      })}

      {sale ? (
        <section className="w-full bg-neutral-100 py-12 lg:py-16 dark:bg-neutral-950">
          <RevealStagger className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-4 px-4 text-center md:px-6">
            <RevealItem className="text-xs uppercase tracking-[0.2em] text-brand-accent">
              Limited time
            </RevealItem>
            <RevealItem className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              {sale.title}
            </RevealItem>
            <RevealItem className="mx-auto max-w-[600px] text-neutral-600 md:text-xl dark:text-neutral-400">
              Limited seasonal offers on selected MZ by LIORA rituals.
            </RevealItem>
            <RevealItem>
              <Link
                href={sale.href}
                className="inline-flex h-10 items-center justify-center rounded-full bg-brand px-8 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand/90"
                prefetch={false}
              >
                Shop {sale.title}
              </Link>
            </RevealItem>
          </RevealStagger>
        </section>
      ) : null}
    </main>
  );
}
