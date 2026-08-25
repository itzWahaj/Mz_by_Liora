import { AddToCart } from "../cart/add-to-cart";
import { Product } from "@/lib/shopify/types";
import ProductAccordion from "./product-accordion";
import ProductPrice from "./product-price";
import StarRating from "./star-rating";
import VariantSelector from "./variant-selector";
import WishlistButton from "../wishlist/wishlist-button";

export function ProductDescription({
  product,
  reviews,
}: {
  product: Product;
  reviews?: { rating: number; reviewCount: number };
}) {
  const rating = reviews?.rating ?? product.reviews?.rating ?? 0;
  const reviewCount = reviews?.reviewCount ?? product.reviews?.reviewCount ?? 0;

  return (
    <>
      <div className="mb-6 flex flex-col gap-2.5 border-b pb-6 dark:border-neutral-700">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-brand md:text-5xl dark:text-white">
          {product.title}
        </h1>
        <div className="py-0.5">
          <StarRating rating={rating} reviewCount={reviewCount} size="md" />
        </div>
        <ProductPrice product={product} />
      </div>

      <VariantSelector options={product.options} variants={product.variants} />

      {/* Prominent Add to Cart CTA & Wishlist Button */}
      <div className="mt-4 flex flex-col gap-3">
        <AddToCart product={product} />
        <WishlistButton
          productId={product.id}
          productTitle={product.title}
          variant="pdp"
        />
      </div>

      {/* Compact Collapsible Product Details Accordion */}
      <ProductAccordion
        descriptionHtml={product.descriptionHtml}
        description={product.description}
      />
    </>
  );
}
