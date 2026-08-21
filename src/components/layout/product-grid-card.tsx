"use client";

import { Product, ProductVariant } from "@/lib/shopify/types";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { addItem } from "../cart/actions";
import { useCart } from "../cart/cart-context";
import { flyToCart } from "../cart/fly-to-cart";
import PriceDisplay, {
  calculateDiscount,
  DiscountBadge,
} from "../price-display";

function firstAvailableVariant(product: Product): ProductVariant | undefined {
  return (
    product.variants.find((item) => item.availableForSale) ||
    product.variants[0]
  );
}

function variantForOptionValue(
  product: Product,
  optionName: string,
  value: string
): ProductVariant | undefined {
  const optionKey = optionName.toLowerCase();
  return product.variants.find((variant) =>
    variant.selectedOptions.some(
      (selected) =>
        selected.name.toLowerCase() === optionKey && selected.value === value
    )
  );
}

export default function ProductGridCard({ product }: { product: Product }) {
  const images = useMemo(
    () =>
      product.images?.length
        ? product.images
        : product.featuredImage?.url
          ? [product.featuredImage]
          : [],
    [product.images, product.featuredImage]
  );
  const primaryUrl = useMemo(
    () => images[0]?.url || product.featuredImage?.url || "",
    [images, product.featuredImage?.url]
  );

  const { addCartItem } = useCart();
  const [message, formAction] = useFormState(addItem, null);
  const [isAdded, setIsAdded] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const reduceMotion = Boolean(useReducedMotion());
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const multiOption = product.options.filter(
    (option) => option.values.length > 1
  );
  const [selectedVariantId, setSelectedVariantId] = useState(
    () => firstAvailableVariant(product)?.id
  );

  const selectedVariant =
    product.variants.find((item) => item.id === selectedVariantId) ||
    firstAvailableVariant(product);

  const canQuickAdd = Boolean(
    product.availableForSale &&
      selectedVariant?.id &&
      selectedVariant.availableForSale
  );

  const actionWithVariant = formAction.bind(null, selectedVariant?.id);
  const priceAmount =
    selectedVariant?.price.amount ||
    product.priceRange.maxVariantPrice.amount;
  const compareAtPriceAmount =
    selectedVariant?.compareAtPrice?.amount || null;
  const priceCurrency =
    selectedVariant?.price.currencyCode ||
    product.priceRange.maxVariantPrice.currencyCode;

  const { hasDiscount, discountPercentage } = calculateDiscount(
    priceAmount,
    compareAtPriceAmount
  );

  const activeImageUrl = useMemo(() => {
    if (images.length > 1) {
      return images[Math.min(imageIndex, images.length - 1)]?.url || primaryUrl;
    }
    return primaryUrl;
  }, [imageIndex, images, primaryUrl]);

  const hoverUrl = useMemo(() => {
    if (images.length > 1) {
      const nextIdx = imageIndex === 0 ? 1 : 0;
      return images[nextIdx]?.url;
    }
    return null;
  }, [images, imageIndex]);

  const hasGallery = images.length > 1;
  const prevImageIndex =
    imageIndex === 0 ? images.length - 1 : imageIndex - 1;
  const nextImageIndex =
    imageIndex + 1 < images.length ? imageIndex + 1 : 0;

  useEffect(() => {
    if (!isAdded) return;
    const timeout = setTimeout(() => setIsAdded(false), 1600);
    return () => clearTimeout(timeout);
  }, [isAdded]);

  function stepImage(next: number, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setImageIndex(next);
  }

  const [imageError, setImageError] = useState(false);
  const displayImageUrl = imageError || !activeImageUrl ? "/logo.png" : activeImageUrl;
  const isFallback = imageError || !activeImageUrl;

  return (
    <motion.div
      className="group relative aspect-square h-full w-full transform-gpu overflow-hidden rounded-2xl"
      initial="rest"
      animate="rest"
      whileHover={reduceMotion ? undefined : "hover"}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      variants={{
        rest: { y: 0 },
        hover: { y: -4 },
      }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 transform-gpu rounded-2xl bg-brand-gradient opacity-0 blur-xl transition-brand group-hover:opacity-30" />

      <Link
        href={`/product/${product.handle}`}
        className="relative block aspect-square h-full w-full rounded-2xl"
        prefetch={true}
      >
        <div className="relative h-full w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 transition-brand group-hover:border-brand-teal dark:border-neutral-800 dark:bg-neutral-900">
          <div className="absolute inset-0">
            {/* Primary / Active Image */}
            <Image
              alt={product.title}
              src={displayImageUrl}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              onError={() => setImageError(true)}
              className={clsx(
                isFallback
                  ? "object-contain p-10 opacity-70 bg-gradient-to-br from-brand-teal/5 via-white to-brand-blue/5 dark:from-neutral-900 dark:to-neutral-950"
                  : "object-cover",
                !reduceMotion && [
                  "transition-all duration-500 ease-out motion-reduce:transition-none",
                  hoverUrl && !isFallback
                    ? "group-hover:opacity-0 group-hover:scale-105"
                    : "group-hover:scale-105",
                ]
              )}
            />

            {/* Secondary Image on Hover */}
            {hoverUrl && !isFallback && (
              <Image
                alt={`${product.title} - secondary view`}
                src={hoverUrl}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className={clsx(
                  "object-cover opacity-0 transition-all duration-500 ease-out motion-reduce:transition-none",
                  !reduceMotion &&
                    "group-hover:opacity-100 group-hover:scale-105"
                )}
              />
            )}
          </div>
        </div>
      </Link>

      {hasDiscount && (
        <div className="pointer-events-none absolute right-3 top-3 z-10">
          <DiscountBadge percentage={discountPercentage} />
        </div>
      )}

      {hasGallery ? (
        <>
          <button
            type="button"
            aria-label={`Previous image of ${product.title}`}
            onClick={(event) => stepImage(prevImageIndex, event)}
            className="pointer-events-auto absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/85 text-brand opacity-0 shadow-sm backdrop-blur transition-brand hover:border-brand-teal hover:bg-white group-hover:opacity-100 max-md:opacity-100 dark:border-white/15 dark:bg-black/60 dark:text-white"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Next image of ${product.title}`}
            onClick={(event) => stepImage(nextImageIndex, event)}
            className="pointer-events-auto absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/85 text-brand opacity-0 shadow-sm backdrop-blur transition-brand hover:border-brand-teal hover:bg-white group-hover:opacity-100 max-md:opacity-100 dark:border-white/15 dark:bg-black/60 dark:text-white"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
          <div
            className={clsx(
              "pointer-events-auto absolute right-3 z-10 flex gap-1",
              hasDiscount ? "top-9" : "top-3"
            )}
          >
            {images.slice(0, 4).map((image, index) => (
              <button
                key={`${image.url}-${index}`}
                type="button"
                aria-label={`Show image ${index + 1} of ${product.title}`}
                onClick={(event) => stepImage(index, event)}
                className={clsx(
                  "h-1.5 w-1.5 rounded-full transition-brand",
                  imageIndex === index
                    ? "scale-125 bg-brand-gradient"
                    : "bg-white/80 ring-1 ring-black/10 hover:bg-white dark:bg-white/40"
                )}
              />
            ))}
          </div>
        </>
      ) : null}

      <div className="pointer-events-none absolute left-3 top-3 z-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${selectedVariant?.id ?? "price"}-${priceAmount}-${compareAtPriceAmount ?? ""}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <div className="rounded-full border border-brand-navy/10 bg-white/85 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-black/60">
              <PriceDisplay
                amount={priceAmount}
                compareAtAmount={compareAtPriceAmount}
                currencyCode={priceCurrency}
                showBadge={false}
                size="xs"
                priceClassName="text-brand dark:text-white"
                compareAtClassName="text-neutral-400 dark:text-neutral-400"
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-cream/90 via-brand-cream/20 to-transparent px-3 pb-3 pt-10 dark:from-black/75 dark:via-transparent dark:to-transparent">
        {multiOption.length > 0 ? (
          <div className="pointer-events-auto mb-2 flex flex-wrap gap-1.5">
            {multiOption.flatMap((option) =>
              option.values.map((value) => {
                const variant = variantForOptionValue(
                  product,
                  option.name,
                  value
                );
                const available = Boolean(variant?.availableForSale);
                const isActive = selectedVariant?.id === variant?.id;

                return (
                  <button
                    key={`${option.id}-${value}`}
                    type="button"
                    disabled={!variant}
                    title={
                      !variant
                        ? `${value} unavailable`
                        : available
                          ? `${option.name}: ${value}`
                          : `${value} (Out of Stock)`
                    }
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      if (variant?.id) setSelectedVariantId(variant.id);
                      // Avoid leaving focus on the chip (keeps + visible via focus styles).
                      (event.currentTarget as HTMLButtonElement).blur();
                    }}
                    className={clsx(
                      "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-brand",
                      isActive
                        ? available
                          ? "border-transparent bg-brand-gradient text-white shadow-sm"
                          : "border-transparent bg-neutral-400 text-white"
                        : available
                          ? "cursor-pointer border-white/80 bg-white/85 text-brand hover:scale-105 hover:border-brand-teal hover:shadow-[0_4px_12px_rgba(20,184,166,0.2)] dark:border-white/15 dark:bg-black/55 dark:text-white dark:hover:border-brand-teal/50"
                          : "cursor-pointer border-neutral-200 bg-neutral-100/80 text-neutral-500 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900/60"
                    )}
                  >
                    {value}
                  </button>
                );
              })
            )}
          </div>
        ) : null}

        <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-brand-navy/10 bg-white/80 px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-black/55 dark:shadow-none">
          <Link
            href={`/product/${product.handle}`}
            className="min-w-0 flex-1"
            prefetch={true}
          >
            <p className="text-sm font-medium leading-snug text-brand dark:text-white">
              {product.title}
            </p>
          </Link>

          <form
            action={async () => {
              if (!canQuickAdd || !selectedVariant) return;
              if (addButtonRef.current) {
                flyToCart(addButtonRef.current, {
                  imageUrl: activeImageUrl || primaryUrl,
                  reducedMotion: reduceMotion,
                });
              }
              addCartItem(selectedVariant, product);
              await actionWithVariant();
              setIsAdded(true);
            }}
            onClick={(event) => event.stopPropagation()}
            className="shrink-0 translate-y-1 opacity-0 transition-brand group-hover:translate-y-0 group-hover:opacity-100 focus-within:translate-y-0 focus-within:opacity-100 max-md:translate-y-0 max-md:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100"
          >
            <motion.button
              ref={addButtonRef}
              type="submit"
              aria-label={
                canQuickAdd
                  ? `Quick add ${product.title}${
                      selectedVariant?.title
                        ? ` (${selectedVariant.title})`
                        : ""
                    } to cart`
                  : `${product.title} unavailable`
              }
              disabled={!canQuickAdd}
              whileTap={canQuickAdd ? { scale: 0.92 } : undefined}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-white shadow-[0_8px_20px_rgba(20,184,166,0.35)] transition-brand hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAdded ? (
                <CheckIcon className="h-4 w-4" strokeWidth={2.5} />
              ) : (
                <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
              )}
            </motion.button>
          </form>
        </div>
        <p className="sr-only" role="status">
          {message}
        </p>
      </div>
    </motion.div>
  );
}
