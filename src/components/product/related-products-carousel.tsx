"use client";

import ProductGridCard from "@/components/layout/product-grid-card";
import { Product } from "@/lib/shopify/types";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";

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
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
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
    const amount = Math.max(el.clientWidth * 0.85, 220);
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  const showControls = products.length > 1;

  return (
    <div className="relative">
      {showControls ? (
        <div className="mb-3 flex justify-end gap-2">
          <button
            type="button"
            aria-label="Previous related products"
            disabled={!canPrev}
            onClick={() => scrollByPage(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300/90 bg-white text-brand shadow-sm transition-brand hover:border-brand-teal/50 hover:shadow-[0_8px_20px_rgba(20,184,166,0.16)] disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next related products"
            disabled={!canNext}
            onClick={() => scrollByPage(1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300/90 bg-white text-brand shadow-sm transition-brand hover:border-brand-teal/50 hover:shadow-[0_8px_20px_rgba(20,184,166,0.16)] disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
          >
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <ul
        ref={scrollerRef}
        className="scrollbar-none flex w-full gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <li
            key={product.handle}
            className="aspect-square w-[78%] flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
          >
            <ProductGridCard product={product} />
          </li>
        ))}
      </ul>
    </div>
  );
}
