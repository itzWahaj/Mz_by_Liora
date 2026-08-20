import { Product } from "@/lib/shopify/types";
import Grid from "../grid";
import ProductGridCard from "./product-grid-card";

export default function ProductGridItems({
  products,
}: {
  products: Product[];
}) {
  return (
    <>
      {products.map((product) => (
        <Grid.Item key={product.handle} className="animate-fadeIn">
          <ProductGridCard product={product} />
        </Grid.Item>
      ))}
    </>
  );
}
