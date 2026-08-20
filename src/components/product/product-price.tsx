"use client";

import Price from "@/components/price";
import { resolveSelectedVariant } from "@/lib/product";
import { Product } from "@/lib/shopify/types";
import { AnimatePresence, motion } from "framer-motion";
import { useProduct } from "./product-context";

export default function ProductPrice({ product }: { product: Product }) {
  const { state } = useProduct();
  const selected = resolveSelectedVariant(product, state);

  const amount =
    selected?.price.amount || product.priceRange.maxVariantPrice.amount;
  const currencyCode =
    selected?.price.currencyCode ||
    product.priceRange.maxVariantPrice.currencyCode;

  return (
    <div className="mr-auto w-auto overflow-hidden rounded-full bg-brand-gradient p-2 text-sm text-white shadow-sm">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${selected?.id ?? "price"}-${amount}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          <Price amount={amount} currencyCode={currencyCode} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
