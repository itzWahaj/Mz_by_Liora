"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, SparklesIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import ProductGridCard from "@/components/layout/product-grid-card";
import { Product } from "@/lib/shopify/types";

export default function RelatedProductsCarousel({
  products,
}: {
  products: Product[];
}) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  function syncArrows() {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 6);
    setCanNext(el.scrollLeft < max - 6);
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    syncArrows();
    el.addEventListener("scroll", syncArrows, { passive: true });
    const ro = new ResizeObserver(syncArrows);
    ro.observe(el);
    window.addEventListener("resize", syncArrows);

    return () => {
      el.removeEventListener("scroll", syncArrows);
      ro.disconnect();
      window.removeEventListener("resize", syncArrows);
    };
  }, [products]);

  function scrollByPage(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.75, 260);
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  if (!products || products.length === 0) return null;

  const isSmallList = products.length <= 4;

  return (
    <section className="border-t border-neutral-200/80 py-16 dark:border-neutral-800">
      {/* Centered Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-teal">
          <SparklesIcon className="h-3.5 w-3.5" />
          Complete Your Ritual
        </div>
        <h2 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl dark:text-white">
          Related Products
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-neutral-500 dark:text-neutral-400">
          Botanical formulations crafted to pair harmoniously with your routine.
        </p>

        {/* Carousel Arrows (if > 4 items) */}
        {!isSmallList && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              aria-label="Previous related products"
              disabled={!canPrev}
              onClick={() => scrollByPage(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-brand shadow-sm transition-all hover:border-brand-teal hover:bg-neutral-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next related products"
              disabled={!canNext}
              onClick={() => scrollByPage(1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-brand shadow-sm transition-all hover:border-brand-teal hover:bg-neutral-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
            >
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Centered Product Cards Grid / Carousel */}
      {isSmallList ? (
        <div
          className={clsx(
            "mx-auto grid gap-6",
            products.length === 1 && "max-w-sm grid-cols-1",
            products.length === 2 && "max-w-2xl grid-cols-1 sm:grid-cols-2",
            products.length === 3 && "max-w-5xl grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
            products.length >= 4 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          )}
        >
          {products.map((product) => (
            <div key={product.handle} className="aspect-square w-full">
              <ProductGridCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
          <ul
            ref={scrollerRef}
            className="scrollbar-none flex w-full snap-x snap-mandatory gap-6 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-4 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {products.map((product) => (
              <li
                key={product.handle}
                className="aspect-square w-[75%] flex-none snap-start min-[480px]:w-[48%] sm:w-[32%] lg:w-[24%]"
              >
                <ProductGridCard product={product} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
