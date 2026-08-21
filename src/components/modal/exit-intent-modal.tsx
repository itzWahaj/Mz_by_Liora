"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, SparklesIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/shopify/types";
import clsx from "clsx";
import PriceDisplay, { DiscountBadge, calculateDiscount } from "@/components/price-display";
import { StarsRow } from "@/components/product/star-rating";

const STORAGE_KEY = "exit_intent_dismissed";

interface ExitIntentModalProps {
  products: Product[];
}

export default function ExitIntentModal({ products }: ExitIntentModalProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const hasTriggeredRef = useRef(false);

  // Check if current route is excluded (checkout, cart, policy pages)
  const isExcludedRoute = useCallback((path: string | null) => {
    if (!path) return false;
    const lower = path.toLowerCase();
    return (
      lower.startsWith("/checkout") ||
      lower.startsWith("/cart") ||
      lower.startsWith("/policies")
    );
  }, []);

  const triggerModal = useCallback(() => {
    if (typeof window === "undefined") return;
    if (hasTriggeredRef.current) return;
    if (isExcludedRoute(pathname)) return;

    try {
      const alreadyDismissed = sessionStorage.getItem(STORAGE_KEY);
      if (alreadyDismissed) return;

      hasTriggeredRef.current = true;
      sessionStorage.setItem(STORAGE_KEY, "true");
      setIsOpen(true);
    } catch {
      // Ignore sessionStorage exceptions
    }
  }, [pathname, isExcludedRoute]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore
    }
  }, []);

  // 1. Search zero-results detector
  useEffect(() => {
    if (pathname === "/search" && searchParams?.get("q")) {
      const timer = setTimeout(() => {
        // Look for zero results indicators in DOM
        const noResultsText = document.body.innerText.includes(
          "There are no products that match"
        );
        if (noResultsText && !hasTriggeredRef.current) {
          triggerModal();
        }
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, triggerModal]);

  // 2. Mouse exit-intent detector (moving toward top browser window)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isExcludedRoute(pathname)) return;

    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }

    // Grace period of 2.5 seconds after page load before arming the listener
    let isArmed = false;
    const armTimer = setTimeout(() => {
      isArmed = true;
    }, 2500);

    const handleMouseLeave = (e: MouseEvent) => {
      if (!isArmed || hasTriggeredRef.current) return;
      // Trigger when cursor leaves from the top of viewport (typical tab closing/back button)
      if (e.clientY <= 15) {
        triggerModal();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(armTimer);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pathname, isExcludedRoute, triggerModal, closeModal]);

  if (!products || products.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-modal-title"
          className="fixed inset-0 z-[1050] flex items-center justify-center overflow-y-auto p-4 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative z-10 my-8 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-neutral-900/95"
          >
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-teal/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-coral/15 blur-3xl" />

            {/* Close Button */}
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close recommendation modal"
              className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            {/* Header Content */}
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-teal dark:bg-brand-teal/20">
                <SparklesIcon className="h-3.5 w-3.5" />
                Curated Recommendations
              </div>

              <h2
                id="exit-modal-title"
                className="mt-3 font-display text-2xl font-bold tracking-tight text-brand sm:text-3xl dark:text-white"
              >
                Can&apos;t find what you&apos;re looking for?
              </h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Maybe this will help... Explore our most-loved botanical skincare rituals.
              </p>
            </div>

            {/* 3 Recommended Product Cards */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {products.slice(0, 3).map((product) => {
                const variant = product.variants[0];
                const price =
                  variant?.price.amount || product.priceRange.maxVariantPrice.amount;
                const comparePrice = variant?.compareAtPrice?.amount || null;
                const currency =
                  variant?.price.currencyCode ||
                  product.priceRange.maxVariantPrice.currencyCode;
                const { hasDiscount, discountPercentage } = calculateDiscount(
                  price,
                  comparePrice
                );

                const primaryImageUrl =
                  product.featuredImage?.url ||
                  product.images?.[0]?.url ||
                  "/logo.png";
                const secondaryImageUrl = product.images?.[1]?.url || null;

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.handle}`}
                    onClick={closeModal}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-teal/50 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900/90"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                      <Image
                        src={primaryImageUrl}
                        alt={product.title}
                        fill
                        sizes="(min-width: 640px) 33vw, 100vw"
                        className={clsx(
                          "object-cover transition-all duration-500",
                          secondaryImageUrl
                            ? "group-hover:opacity-0 group-hover:scale-105"
                            : "group-hover:scale-105"
                        )}
                      />
                      {secondaryImageUrl && (
                        <Image
                          src={secondaryImageUrl}
                          alt={`${product.title} - secondary view`}
                          fill
                          sizes="(min-width: 640px) 33vw, 100vw"
                          className="object-cover opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
                        />
                      )}
                      {hasDiscount && (
                        <div className="absolute right-2 top-2 z-10">
                          <DiscountBadge
                            percentage={discountPercentage}
                            className="shadow-md"
                          />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="mt-3 flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="line-clamp-1 text-sm font-semibold text-brand group-hover:text-brand-teal dark:text-white">
                          {product.title}
                        </h3>
                        <div className="mt-1 flex items-center justify-between">
                          <PriceDisplay
                            amount={price}
                            compareAtAmount={comparePrice}
                            currencyCode={currency}
                            size="xs"
                            priceClassName="text-brand dark:text-white font-medium"
                            compareAtClassName="text-neutral-400 text-[10px]"
                            showBadge={false}
                          />
                          <div className="flex items-center gap-1">
                            <StarsRow
                              rating={
                                product.reviews?.rating && product.reviews.rating > 0
                                  ? product.reviews.rating
                                  : 5
                              }
                              sizeClass="h-2.5 w-2.5"
                            />
                            <span className="text-[10px] font-medium text-neutral-500">
                              {(
                                product.reviews?.rating && product.reviews.rating > 0
                                  ? product.reviews.rating
                                  : 5
                              ).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Link */}
                      <div className="mt-3 flex items-center justify-between pt-2 text-xs font-semibold text-brand-teal">
                        <span>View Details</span>
                        <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Footer Continue Shopping */}
            <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-neutral-100 pt-4 text-center sm:flex-row sm:text-left dark:border-neutral-800">
              <span className="text-xs text-neutral-500">
                Handcrafted clean beauty formulated in Pakistan.
              </span>
              <button
                type="button"
                onClick={closeModal}
                className="text-xs font-semibold text-neutral-600 transition-colors hover:text-brand dark:text-neutral-400 dark:hover:text-white"
              >
                Continue Browsing
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
