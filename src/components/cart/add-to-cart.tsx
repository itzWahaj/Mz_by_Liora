"use client";

import { Product } from "@/lib/shopify/types";
import { resolveSelectedVariant } from "@/lib/product";
import { useProduct } from "../product/product-context";
import { useCart } from "./cart-context";
import { useFormState } from "react-dom";
import clsx from "clsx";
import { CheckIcon, PlusIcon } from "@heroicons/react/24/outline";
import { motion, useReducedMotion } from "framer-motion";
import { addItem } from "./actions";
import { flyToCart } from "./fly-to-cart";
import { trackMetaEvent } from "@/lib/meta/pixel";
import { useEffect, useRef, useState } from "react";

function SubmitButton({
  availableForSale,
  isAdded,
  selectedVariantId,
  buttonRef,
}: {
  availableForSale: boolean;
  isAdded: boolean;
  selectedVariantId: string | undefined;
  buttonRef?: React.Ref<HTMLButtonElement>;
}) {
  const reduceMotion = Boolean(useReducedMotion());
  const buttonClasses =
    "relative flex w-full items-center justify-center rounded-full border border-[#596522] bg-[#596522] px-4 py-3.5 text-sm font-semibold tracking-wide text-white shadow-sm transition-all hover:bg-[#C49A45] hover:border-[#C49A45] hover:shadow-[0_8px_20px_rgba(196,154,69,0.35)]";
  const disabledClasses = "cursor-not-allowed opacity-60 hover:opacity-60";

  if (!availableForSale) {
    return (
      <button disabled className={clsx(buttonClasses, disabledClasses)}>
        Out of Stock
      </button>
    );
  }

  if (!selectedVariantId) {
    return (
      <button
        aria-label="Please select an option"
        disabled
        className={clsx(buttonClasses, disabledClasses)}
      >
        <div className="absolute left-0 ml-4">
          <PlusIcon className="h-5" />
        </div>
        Add to Cart
      </button>
    );
  }

  return (
    <motion.button
      ref={buttonRef}
      aria-label="Add to cart"
      whileTap={reduceMotion ? undefined : { scale: 0.95 }}
      className={clsx(buttonClasses, {
        "hover:opacity-90": true,
        "bg-brand-gradient": isAdded,
      })}
    >
      <span className="absolute inset-0 overflow-hidden rounded-full">
        <span
          className={clsx(
            "absolute inset-y-0 left-[-40%] w-[35%] rotate-12 bg-white/25",
            reduceMotion
              ? isAdded
                ? "opacity-100"
                : "opacity-0"
              : clsx(
                  "transition-brand",
                  isAdded ? "translate-x-[280%]" : "translate-x-0 opacity-0"
                )
          )}
        />
      </span>
      <div className="absolute left-0 ml-4">
        {isAdded ? <CheckIcon className="h-5" /> : <PlusIcon className="h-5" />}
      </div>
      {isAdded ? "Added" : "Add To Cart"}
    </motion.button>
  );
}

export function AddToCart({ product }: { product: Product }) {
  const { availableForSale } = product;
  const { addCartItem } = useCart();
  const { state } = useProduct();
  const [message, formAction] = useFormState(addItem, null);
  const finalVariant = resolveSelectedVariant(product, state);
  const selectedVariantId = finalVariant?.id;
  const actionWithVariant = formAction.bind(null, selectedVariantId);
  const [isAdded, setIsAdded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = Boolean(useReducedMotion());

  useEffect(() => {
    if (!isAdded) return;
    const timeout = setTimeout(() => setIsAdded(false), 1500);
    return () => clearTimeout(timeout);
  }, [isAdded]);

  const imageUrl =
    product.featuredImage?.url || product.images[0]?.url || null;

  return (
    <form
      action={async () => {
        if (!finalVariant) return;
        if (buttonRef.current) {
          flyToCart(buttonRef.current, {
            imageUrl,
            reducedMotion: reduceMotion,
          });
        }
        addCartItem(finalVariant, product);

        // Fire Meta Pixel & CAPI AddToCart event
        const itemPrice = parseFloat(finalVariant.price.amount || "0");
        const itemCurrency = finalVariant.price.currencyCode || "PKR";
        trackMetaEvent("AddToCart", {
          customData: {
            content_ids: [finalVariant.id, product.id],
            content_name: product.title,
            content_type: "product",
            value: itemPrice,
            currency: itemCurrency,
            contents: [
              {
                id: finalVariant.id,
                quantity: 1,
                item_price: itemPrice,
                title: `${product.title}${finalVariant.title && finalVariant.title !== "Default Title" ? ` - ${finalVariant.title}` : ""}`,
              },
            ],
          },
        });

        await actionWithVariant();
        setIsAdded(true);
      }}
    >
      <SubmitButton
        availableForSale={availableForSale}
        isAdded={isAdded}
        selectedVariantId={selectedVariantId}
        buttonRef={buttonRef}
      />
      <p className="sr-only" role="status" aria-label="polite">
        {message}
      </p>
    </form>
  );
}
