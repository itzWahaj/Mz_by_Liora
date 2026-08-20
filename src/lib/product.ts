import { Product, ProductVariant } from "@/lib/shopify/types";

export function resolveSelectedVariant(
  product: Product,
  state: Record<string, string>
): ProductVariant | undefined {
  const matched = product.variants.find((variant) =>
    variant.selectedOptions.every(
      (option) => option.value === state[option.name.toLowerCase()]
    )
  );
  if (matched) return matched;
  return (
    product.variants.find((variant) => variant.availableForSale) ||
    product.variants[0]
  );
}
