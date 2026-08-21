export const runtime = "edge";

import Gallery from "@/components/product/gallery";
import { ProductProvider } from "@/components/product/product-context";
import { ProductDescription } from "@/components/product/product-description";
import RelatedProductsCarousel from "@/components/product/related-products-carousel";
import ReviewsSection from "@/components/product/reviews-section";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import Skeleton from "@/components/ui/skeleton";
import { BRAND, HIDDEN_PRODUCT_TAG } from "@/lib/constants";
import { getJudgeMeReviews } from "@/lib/judgeme";
import { getProduct, getProductRecommendations } from "@/lib/shopify";
import { Image } from "@/lib/shopify/types";
import { getSiteUrl } from "@/lib/utils";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata({
  params,
}: {
  params: { handle: string };
}): Promise<Metadata> {
  const product = await getProduct(params.handle);

  if (!product) return notFound();

  const { url, width, height, altText: alt } = product.featuredImage || {};
  const indexable = !product.tags.includes(HIDDEN_PRODUCT_TAG);

  // Clean HTML tags from description and truncate to ~155 characters for search engines
  const rawDescription = product.seo.description || product.description || "";
  const cleanDescription = rawDescription
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const truncatedDescription =
    cleanDescription.length > 158
      ? `${cleanDescription.substring(0, 155)}...`
      : cleanDescription || BRAND.metaDescription;

  const title = product.seo.title || `${product.title} | MZ by LIORA`;

  return {
    title,
    description: truncatedDescription,
    alternates: {
      canonical: `/product/${product.handle}`,
    },
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable,
      },
    },
    openGraph: {
      title,
      description: truncatedDescription,
      url: `/product/${product.handle}`,
      type: "website",
      images: url
        ? [
            {
              url,
              width: width || 800,
              height: height || 800,
              alt: alt || product.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: truncatedDescription,
      images: url ? [url] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { handle: string };
}) {
  const product = await getProduct(params.handle);
  if (!product) return notFound();

  const judgeMeData = await getJudgeMeReviews({
    productHandle: product.handle,
    productId: product.id,
  });

  const siteUrl = getSiteUrl();
  const rawDescription = product.description || product.seo.description || "";
  const cleanDescription = rawDescription.replace(/<[^>]*>/g, "").trim();

  // Calculate genuine visible review stats from live Judge.me reviews or Shopify metadata
  const liveReviews = judgeMeData.reviews || [];
  const liveReviewCount = liveReviews.length;
  const liveRating =
    liveReviewCount > 0
      ? liveReviews.reduce((sum, r) => sum + r.rating, 0) / liveReviewCount
      : 0;

  const effectiveReviewCount =
    liveReviewCount > 0
      ? liveReviewCount
      : product.reviews?.reviewCount || 0;
  const effectiveRating =
    liveReviewCount > 0
      ? liveRating
      : product.reviews?.rating || 0;
  const hasGenuineReviews = effectiveReviewCount > 0 && effectiveRating > 0;

  // Schema.org/Product structured data adhering strictly to Google Search Central guidelines
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: cleanDescription || product.title,
    image: product.images?.length
      ? product.images.map((img) => img.url)
      : product.featuredImage?.url
        ? [product.featuredImage.url]
        : [],
    brand: {
      "@type": "Brand",
      name: "MZ by LIORA",
    },
    offers: {
      "@type": "Offer",
      price: product.priceRange.minVariantPrice.amount,
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      availability: product.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${siteUrl}/product/${product.handle}`,
      seller: {
        "@type": "Organization",
        name: "MZ by LIORA",
      },
    },
    // Only include aggregateRating if genuine reviews actually exist and are visible on the page
    ...(hasGenuineReviews
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: effectiveRating.toFixed(1),
            reviewCount: effectiveReviewCount,
            bestRating: "5",
            worstRating: "1",
          },
          ...(judgeMeData.reviews?.length > 0
            ? {
                review: judgeMeData.reviews.slice(0, 5).map((rev) => ({
                  "@type": "Review",
                  reviewRating: {
                    "@type": "Rating",
                    ratingValue: rev.rating,
                    bestRating: "5",
                    worstRating: "1",
                  },
                  author: {
                    "@type": "Person",
                    name: rev.reviewer?.name || "Verified Buyer",
                  },
                  datePublished: rev.created_at,
                  reviewBody: rev.body,
                })),
              }
            : {}),
        }
      : {}),
  };

  // Identify primary collection for breadcrumb hierarchy
  const primaryCollection =
    product.collections?.find(
      (c) =>
        c.handle !== "hidden" &&
        c.handle !== "new-arrivals" &&
        c.handle !== "featured" &&
        c.handle !== "best-sellers"
    ) ||
    product.collections?.find((c) => c.handle !== "hidden") ||
    null;

  const breadcrumbCategoryName = primaryCollection?.title || "Shop";
  const breadcrumbCategoryPath = primaryCollection
    ? `/collections/${primaryCollection.handle}`
    : "/search";

  // BreadcrumbList JSON-LD Schema
  const breadcrumbJsonLd = {
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
        name: breadcrumbCategoryName,
        item: `${siteUrl}${breadcrumbCategoryPath}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: `${siteUrl}/product/${product.handle}`,
      },
    ],
  };

  return (
    <ProductProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <div className="mx-auto max-w-screen-2xl px-4 py-4">
        {/* Visual Breadcrumb Navigation */}
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: breadcrumbCategoryName, href: breadcrumbCategoryPath },
            { name: product.title },
          ]}
          className="mb-4"
        />

        <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-8 md:p-12 lg:flex-row lg:gap-8 dark:border-neutral-800 dark:bg-black">
          <div className="h-full w-full basis-full lg:basis-4/6">
            <Suspense
              fallback={
                <Skeleton className="aspect-square h-full max-h-[550px] w-full rounded-2xl" />
              }
            >
              <Gallery
                images={product.images.slice(0, 5).map((image: Image) => ({
                  src: image.url,
                  altText: image.altText,
                }))}
              />
            </Suspense>
          </div>
          <div className="basis-full lg:basis-2/6">
            <Suspense
              fallback={
                <div className="space-y-3">
                  <Skeleton className="h-10 w-4/5 rounded-full" />
                  <Skeleton className="h-6 w-1/4 rounded-full" />
                  <Skeleton className="h-4 w-full rounded-full" />
                  <Skeleton className="h-4 w-5/6 rounded-full" />
                  <Skeleton className="h-12 w-full rounded-full" />
                </div>
              }
            >
              <ProductDescription product={product} />
            </Suspense>
          </div>
        </div>

        {/* Judge.me Reviews Section */}
        <ReviewsSection
          productId={product.id}
          productHandle={product.handle}
          productTitle={product.title}
          initialReviews={judgeMeData.reviews}
          reviewSummary={product.reviews}
        />

        <RelatedProducts id={product.id} />
      </div>
    </ProductProvider>
  );
}

async function RelatedProducts({ id }: { id: string }) {
  const relatedProducts = await getProductRecommendations(id);

  if (!relatedProducts?.length) return null;

  return <RelatedProductsCarousel products={relatedProducts} />;
}
