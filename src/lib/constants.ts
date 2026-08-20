export const BRAND = {
  tagline: "Care Beyond Standards",
  description:
    "Premium skincare formulated for purity, calm, and lasting radiance.",
  metaDescription:
    "Care Beyond Standards. Premium skincare and beauty by MZ by LIORA.",
} as const;

export const TAGS = {
  collections: "collections",
  products: "products",
  cart: "cart",
};

export const HOMEPAGE_COLLECTIONS = [
  {
    handle: "featured",
    title: "Featured",
    href: "/search/featured",
  },
  {
    handle: "best-sellers",
    title: "Best Sellers",
    href: "/search/best-sellers",
  },
  {
    handle: "moisturizers",
    title: "Moisturizers",
    href: "/search/moisturizers",
  },
  {
    handle: "cleansers-soaps",
    title: "Cleansers & Soaps",
    href: "/search/cleansers-soaps",
  },
  {
    handle: "face-oils",
    title: "Face Oils",
    href: "/search/face-oils",
  },
] as const;

export type SortFilterItem = {
  title: string;
  slug: string | null;
  sortKey: "RELEVANCE" | "BEST_SELLING" | "CREATED_AT" | "PRICE";
  reverse: boolean;
};

export const defaultSort: SortFilterItem = {
  title: "Relevance",
  slug: null,
  sortKey: "RELEVANCE",
  reverse: false,
};

export const sorting: SortFilterItem[] = [
  defaultSort,
  {
    title: "Trending",
    slug: "trending-desc",
    sortKey: "BEST_SELLING",
    reverse: false,
  }, // asc
  {
    title: "Latest arrivals",
    slug: "latest-desc",
    sortKey: "CREATED_AT",
    reverse: true,
  },
  {
    title: "Price: Low to high",
    slug: "price-asc",
    sortKey: "PRICE",
    reverse: false,
  }, // asc
  {
    title: "Price: High to low",
    slug: "price-desc",
    sortKey: "PRICE",
    reverse: true,
  },
];

export const HIDDEN_PRODUCT_TAG = "nextjs-frontend-hidden";
export const DEFAULT_OPTION = "Default Title";
export const SHOPIFY_GRAPHQL_API_ENDPOINT = "/api/2024-07/graphql.json";
