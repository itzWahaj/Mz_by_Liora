"use client";

import { ProductOption, ProductVariant } from "@/lib/shopify/types";
import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useProduct, useUpdateURL } from "./product-context";

type Combination = {
  id: string;
  availableForSale: boolean;
  [key: string]: string | boolean;
};

export default function VariantSelector({
  options,
  variants,
}: {
  options: ProductOption[];
  variants: ProductVariant[];
}) {
  const { state, updateOption } = useProduct();
  const updateURL = useUpdateURL();
  const reduceMotion = Boolean(useReducedMotion());
  const didInit = useRef(false);
  const hasNoOptionsOrJustOneOption =
    !options.length ||
    (options.length === 1 && options[0]?.values.length === 1);

  const combinations: Combination[] = variants.map((variant) => ({
    id: variant.id,
    availableForSale: variant.availableForSale,
    ...variant.selectedOptions.reduce(
      (accumulator, option) => ({
        ...accumulator,
        [option.name.toLowerCase()]: option.value,
      }),
      {}
    ),
  }));

  useEffect(() => {
    if (didInit.current || hasNoOptionsOrJustOneOption) return;
    didInit.current = true;

    const available = combinations.find((item) => item.availableForSale);
    if (!available) return;

    let next = { ...state };
    let changed = false;
    for (const option of options) {
      const key = option.name.toLowerCase();
      if (next[key]) continue;
      const value = available[key];
      if (typeof value === "string") {
        next = { ...next, [key]: value };
        changed = true;
        updateOption(key, value);
      }
    }
    if (changed) updateURL(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (hasNoOptionsOrJustOneOption) {
    return null;
  }

  return (
    <>
      {options.map((option) => {
        const optionNameLowerCase = option.name.toLowerCase();
        const defaultValue =
          state[optionNameLowerCase] ||
          option.values.find((value) => {
            const optionParams = { ...state, [optionNameLowerCase]: value };
            const filtered = Object.entries(optionParams).filter(([key, val]) =>
              options.find(
                (item) =>
                  item.name.toLowerCase() === key && item.values.includes(val)
              )
            );
            return combinations.find((combination) =>
              filtered.every(
                ([key, val]) =>
                  combination[key] === val && combination.availableForSale
              )
            );
          }) ||
          option.values[0];

        return (
          <div key={option.id} className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#4D581E] dark:text-neutral-300">
              {option.name}
            </p>
            <div className="flex flex-wrap gap-3">
              {option.values.map((value) => {
                const optionParams = {
                  ...state,
                  [optionNameLowerCase]: value,
                };

                const filtered = Object.entries(optionParams).filter(
                  ([key, val]) =>
                    options.find(
                      (item) =>
                        item.name.toLowerCase() === key &&
                        item.values.includes(val)
                    )
                );

                const isAvailableForSale = Boolean(
                  combinations.find((combination) =>
                    filtered.every(
                      ([key, val]) =>
                        combination[key] === val && combination.availableForSale
                    )
                  )
                );

                const isActive =
                  (state[optionNameLowerCase] || defaultValue) === value;

                return (
                  <motion.button
                    key={value}
                    type="button"
                    disabled={!isAvailableForSale}
                    aria-disabled={!isAvailableForSale}
                    aria-pressed={isActive}
                    title={`${option.name} ${value}${!isAvailableForSale ? " (Out of Stock)" : ""}`}
                    whileHover={
                      isAvailableForSale && !reduceMotion
                        ? { y: -1, scale: 1.03 }
                        : undefined
                    }
                    whileTap={
                      isAvailableForSale && !reduceMotion
                        ? { scale: 0.97 }
                        : undefined
                    }
                    onClick={() => {
                      if (!isAvailableForSale) return;
                      const newState = updateOption(
                        optionNameLowerCase,
                        value
                      );
                      updateURL(newState);
                    }}
                    className={clsx(
                      "relative flex min-w-[52px] items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition-brand",
                      {
                        "border-[#596522] bg-[#596522] text-white shadow-[0_8px_20px_rgba(89,101,34,0.3)]":
                          isActive && isAvailableForSale,
                        "border-[#D8BB7A]/60 bg-[#FFFDF8] text-[#303515] hover:border-[#C49A45] hover:bg-[#FAF9F4] hover:text-[#4D581E] hover:shadow-[0_8px_20px_rgba(196,154,69,0.14)] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-[#D8BB7A] dark:hover:bg-neutral-800":
                          !isActive && isAvailableForSale,
                        "cursor-not-allowed border-neutral-200 bg-neutral-100/70 text-neutral-400 opacity-45 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-500":
                          !isAvailableForSale,
                      }
                    )}
                  >
                    {value}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
