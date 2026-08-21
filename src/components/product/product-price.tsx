"use client";

import PriceDisplay from "@/components/price-display";
import { resolveSelectedVariant } from "@/lib/product";
import { Product } from "@/lib/shopify/types";
import { AnimatePresence, motion } from "framer-motion";
import { useProduct } from "./product-context";

export default function ProductPrice({ product }: { product: Product }) {
  const { state } = useProduct();
  const selected = resolveSelectedVariant(product, state);

  const amount =
    selected?.price.amount || product.priceRange.maxVariantPrice.amount;
  const compareAtAmount = selected?.compareAtPrice?.amount || null;
  const currencyCode =
    selected?.price.currencyCode ||
    product.priceRange.maxVariantPrice.currencyCode;

  return (
    <div className="mr-auto w-auto overflow-hidden rounded-full bg-brand-gradient px-4 py-2 text-white shadow-sm">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${selected?.id ?? "price"}-${amount}-${compareAtAmount ?? ""}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          <PriceDisplay
            amount={amount}
            compareAtAmount={compareAtAmount}
            currencyCode={currencyCode}
            size="md"
            priceClassName="text-white"
            compareAtClassName="text-white/70"
            badgeClassName="bg-white text-brand-coral font-bold shadow-none ring-0"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
