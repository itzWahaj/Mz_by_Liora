export const runtime = "edge";

import Gallery from "@/components/product/gallery";
import { ProductProvider } from "@/components/product/product-context";
import { ProductDescription } from "@/components/product/product-description";
import RelatedProductsCarousel from "@/components/product/related-products-carousel";
import ReviewsSection from "@/components/product/reviews-section";
import Skeleton from "@/components/ui/skeleton";
import { HIDDEN_PRODUCT_TAG } from "@/lib/constants";
import { getJudgeMeReviews } from "@/lib/judgeme";
import { getProduct, getProductRecommendations } from "@/lib/shopify";
import { Image } from "@/lib/shopify/types";
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

  return {
    title: product.seo.title || product.title,
    description: product.seo.description || product.description,
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable,
      },
    },
    openGraph: url
      ? {
          images: [
            {
              url,
              width,
              height,
              alt,
            },
          ],
        }
      : null,
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

  return (
    <ProductProvider>
      <div className="mx-auto max-w-screen-2xl px-4">
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
