"use client";

import { useEffect, useRef } from "react";
import { Product } from "@/lib/shopify/types";
import { trackMetaEvent } from "@/lib/meta/pixel";

export default function ProductViewTracker({ product }: { product: Product }) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!product || trackedRef.current) return;
    trackedRef.current = true;

    const price = parseFloat(
      product.priceRange?.minVariantPrice?.amount ||
        product.variants?.[0]?.price?.amount ||
        "0"
    );
    const currency =
      product.priceRange?.minVariantPrice?.currencyCode ||
      product.variants?.[0]?.price?.currencyCode ||
      "PKR";

    const variantIds = product.variants?.map((v) => v.id) || [];
    const contentIds = [product.id, ...variantIds].filter(Boolean);

    trackMetaEvent("ViewContent", {
      customData: {
        content_ids: contentIds.length > 0 ? contentIds : [product.id],
        content_name: product.title,
        content_type: "product",
        value: price,
        currency,
        contents: [
          {
            id: product.id,
            quantity: 1,
            item_price: price,
            title: product.title,
          },
        ],
      },
    });
  }, [product]);

  return null;
}
