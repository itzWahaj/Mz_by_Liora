import Grid from "@/components/grid";
import ProductGridItems from "@/components/layout/product-grid-items";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { defaultSort, sorting } from "@/lib/constants";
import { getCollection, getCollectionProducts } from "@/lib/shopify";
import { getSiteUrl } from "@/lib/utils";
import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: { collection: string };
}): Promise<Metadata> {
  const collection = await getCollection(params.collection);

  if (!collection) return notFound();

  const title = collection.seo?.title || `${collection.title} | MZ by LIORA`;
  const description =
    collection.seo?.description ||
    collection.description ||
    `Explore ${collection.title} skincare and botanical essentials at MZ by LIORA. Care Beyond Standards.`;

  const imageUrl = collection.image?.url;
  const canonicalPath = `/collections/${params.collection}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: "website",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: collection.image?.altText || collection.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { collection: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { sort } = searchParams as { [key: string]: string };
  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;

  const [collection, products] = await Promise.all([
    getCollection(params.collection),
    getCollectionProducts({
      collection: params.collection,
      sortKey,
      reverse,
    }),
  ]);

  const collectionImage = collection?.image?.url;
  const siteUrl = getSiteUrl();

  // BreadcrumbList JSON-LD Schema for Collection
  const breadcrumbJsonLd = collection
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Shop",
            item: `${siteUrl}/search`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: collection.title,
            item: `${siteUrl}/collections/${params.collection}`,
          },
        ],
      }
    : null;

  return (
    <div className="space-y-6">
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbJsonLd),
          }}
        />
      )}

      {/* Visual Breadcrumbs */}
      {collection && (
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Shop", href: "/search" },
            { name: collection.title },
          ]}
        />
      )}

      {/* Featured Collection Hero Banner */}
      {collection && (
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200/80 bg-gradient-to-br from-brand-cream/80 via-white to-brand-teal/5 p-6 shadow-sm sm:p-8 dark:border-neutral-800 dark:from-neutral-900/90 dark:via-neutral-950 dark:to-neutral-900">
          <div className="flex flex-col-reverse items-center justify-between gap-6 sm:flex-row">
            {/* Collection Info */}
            <div className="max-w-xl text-center sm:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-teal dark:bg-brand-teal/20">
                Collection • {products.length} {products.length === 1 ? "Product" : "Products"}
              </div>
              <h1 className="mt-2.5 font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl dark:text-white">
                {collection.title}
              </h1>
              {collection.description && (
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {collection.description}
                </p>
              )}
            </div>

            {/* Collection Image */}
            {collectionImage && (
              <div className="relative aspect-[4/3] w-40 shrink-0 overflow-hidden rounded-2xl border border-white/80 shadow-md sm:w-52 md:w-60 dark:border-neutral-700">
                <Image
                  src={collectionImage}
                  alt={collection.image?.altText || collection.title}
                  fill
                  priority
                  sizes="(min-width: 640px) 240px, 160px"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Grid */}
      <section>
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 p-12 text-center text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <p className="text-base font-medium">No products found in this collection.</p>
            <p className="mt-1 text-xs">Check back soon as we add new formulations.</p>
          </div>
        ) : (
          <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <ProductGridItems products={products} />
          </Grid>
        )}
      </section>
    </div>
  );
}
