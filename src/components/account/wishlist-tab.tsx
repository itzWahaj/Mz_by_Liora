"use client";

import { Product } from "@/lib/shopify/types";
import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "@/components/wishlist/wishlist-context";
import { formatPrice } from "@/lib/utils";
import PriceDisplay, { calculateDiscount } from "@/components/price-display";
import {
  HeartIcon,
  ShoppingBagIcon,
  TrashIcon,
  ChevronRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useCart } from "@/components/cart/cart-context";
import { addItem } from "@/components/cart/actions";
import { useState } from "react";

export default function WishlistTab({
  initialProducts = [],
}: {
  initialProducts: Product[];
}) {
  const { wishlist, toggleWishlist, isInWishlist } = useWishlist();
  const { addCartItem } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);

  // Filter products by currently active wishlist IDs
  const activeProducts = initialProducts.filter((p) => isInWishlist(p.id));

  async function handleAddToCart(product: Product) {
    const variantId = product.variants[0]?.id;
    if (!variantId) return;

    setAddingId(product.id);
    try {
      await addItem(null, variantId);
      const variant = product.variants[0];
      if (variant) {
        addCartItem(variant, product);
      }
    } catch (err) {
      console.error("Failed to add wishlist item to cart:", err);
    } finally {
      setAddingId(null);
    }
  }

  if (activeProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-[#D8BB7A]/50 bg-[#FFFDF8] p-12 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#596522]/10 text-[#596522]">
          <HeartIcon className="h-8 w-8 text-[#C49A45]" />
        </div>
        <h3 className="mt-4 font-display text-2xl font-semibold text-[#4D581E]">
          Your Wishlist is Empty
        </h3>
        <p className="mt-2 max-w-md text-sm text-[#303515]/70">
          Save your favorite botanical formulations, cold-pressed oils, and skincare rituals to review and purchase anytime.
        </p>
        <Link
          href="/search"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#596522] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#C49A45] hover:shadow-lg"
        >
          <span>Explore Rituals</span>
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-bold text-[#4D581E]">
          Saved Products ({activeProducts.length})
        </h3>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {activeProducts.map((product) => {
          const featuredImage = product.featuredImage || product.images?.[0];
          const priceAmount = product.priceRange.maxVariantPrice.amount;
          const currencyCode = product.priceRange.maxVariantPrice.currencyCode;
          const compareAtAmount = product.variants[0]?.compareAtPrice?.amount || null;

          const isAdding = addingId === product.id;

          return (
            <div
              key={product.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#D8BB7A]/50 bg-[#FFFDF8] p-4 shadow-sm transition-all duration-300 hover:border-[#C49A45] hover:shadow-md"
            >
              {/* Top Row: Remove Action */}
              <div className="absolute right-3 top-3 z-10">
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id, product.title)}
                  title="Remove from wishlist"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D8BB7A]/40 bg-white/90 text-[#303515]/70 shadow-xs backdrop-blur-sm transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Product Thumbnail */}
              <Link
                href={`/product/${product.handle}`}
                className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[#D8BB7A]/30 bg-[#FAF9F4]"
              >
                {featuredImage?.url ? (
                  <Image
                    src={featuredImage.url}
                    alt={featuredImage.altText || product.title}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <Image
                    src="/logo_3.png"
                    alt="MZ by LIORA"
                    fill
                    className="object-contain p-8 opacity-70"
                  />
                )}
              </Link>

              {/* Product Info */}
              <div className="mt-4 flex flex-1 flex-col justify-between">
                <div>
                  <Link
                    href={`/product/${product.handle}`}
                    className="font-display text-base font-bold text-[#303515] transition-colors hover:text-[#596522]"
                  >
                    {product.title}
                  </Link>

                  <div className="mt-2">
                    <PriceDisplay
                      amount={priceAmount}
                      compareAtAmount={compareAtAmount}
                      currencyCode={currencyCode}
                      size="sm"
                      priceClassName="text-[#4D581E]"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.availableForSale || isAdding}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#596522] py-2.5 px-4 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#C49A45] disabled:opacity-50"
                  >
                    <ShoppingBagIcon className="h-4 w-4" />
                    <span>{isAdding ? "Adding..." : "Add to Cart"}</span>
                  </button>

                  <Link
                    href={`/product/${product.handle}`}
                    className="inline-flex items-center justify-center rounded-full border border-[#D8BB7A]/60 bg-white py-2.5 px-3 text-xs font-semibold text-[#303515] hover:border-[#C49A45] hover:text-[#596522]"
                  >
                    <span>View</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
