export const runtime = "edge";

import { getProducts } from "@/lib/shopify";
import { NextRequest, NextResponse } from "next/server";

export type SearchSuggestion = {
  handle: string;
  title: string;
  href: string;
  imageUrl: string | null;
  imageAlt: string;
  amount: string;
  currencyCode: string;
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ products: [] as SearchSuggestion[] });
  }

  try {
    const products = await getProducts({
      query: q,
      sortKey: "RELEVANCE",
    });

    const suggestions: SearchSuggestion[] = products.slice(0, 6).map((product) => {
      const image = product.featuredImage?.url
        ? product.featuredImage
        : product.images[0] ?? null;

      return {
        handle: product.handle,
        title: product.title,
        href: `/product/${product.handle}`,
        imageUrl: image?.url ?? null,
        imageAlt: image?.altText || product.title,
        amount: product.priceRange.minVariantPrice.amount,
        currencyCode: product.priceRange.minVariantPrice.currencyCode,
      };
    });

    return NextResponse.json({ products: suggestions });
  } catch (error) {
    console.error("Predictive search failed", error);
    return NextResponse.json(
      { products: [] as SearchSuggestion[], error: "search_failed" },
      { status: 500 }
    );
  }
}
