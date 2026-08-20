import { AddToCart } from "../cart/add-to-cart";
import Prose from "../prose";
import { Product } from "@/lib/shopify/types";
import ProductPrice from "./product-price";
import VariantSelector from "./variant-selector";

export function ProductDescription({ product }: { product: Product }) {
  return (
    <>
      <div className="mb-6 flex flex-col border-b pb-6 dark:border-neutral-700">
        <h1 className="mb-2 font-display text-5xl font-medium">{product.title}</h1>
        <ProductPrice product={product} />
      </div>
      <VariantSelector options={product.options} variants={product.variants} />
      {product.descriptionHtml ? (
        <Prose
          className="mb-6 text-sm leading-light dark:text-white/[60%]"
          html={product.descriptionHtml}
        />
      ) : null}
      <AddToCart product={product} />
    </>
  );
}
