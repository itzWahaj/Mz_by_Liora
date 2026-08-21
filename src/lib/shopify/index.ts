import { NextRequest, NextResponse } from "next/server";
import {
  HIDDEN_PRODUCT_TAG,
  SHOPIFY_GRAPHQL_API_ENDPOINT,
  TAGS,
} from "../constants";
import { isShopifyError } from "../type-guards";
import { ensureStartWith } from "../utils";
import {
  addToCartMutation,
  createCartMutation,
  editCartItemsMutation,
  removeFromCartMutation,
} from "./mutations/cart";
import { getCartQuery } from "./queries/cart";
import {
  getCollectionProductsQuery,
  getCollectionQuery,
  getCollectionsQuery,
} from "./queries/collection";
import { getMenuQuery } from "./queries/menu";
import {
  getProductQuery,
  getProductRecommendationsQuery,
  getProductsQuery,
} from "./queries/product";
import {
  Cart,
  Collection,
  Connection,
  Image,
  Menu,
  Page,
  Product,
  ReviewSummary,
  ShopifyAddToCartOperation,
  ShopifyCart,
  ShopifyCartOperation,
  ShopifyCollection,
  ShopifyCollectionOperation,
  ShopifyCollectionProductsOperation,
  ShopifyCollectionsOperation,
  ShopifyCreateCartOperation,
  ShopifyMenuItem,
  ShopifyMenuOperation,
  ShopifyPageOperation,
  ShopifyPagesOperation,
  ShopifyProduct,
  ShopifyProductOperation,
  ShopifyProductRecommendationsOperation,
  ShopifyProductsOperation,
  ShopifyRemoveFromCartOperation,
  ShopifyShopPoliciesOperation,
  ShopifyUpdateCartOperation,
  ShopPolicy,
} from "./types";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { getPageQuery, getPagesQuery } from "./queries/page";
import { getShopPoliciesQuery } from "./queries/policy";

const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? ensureStartWith(process.env.SHOPIFY_STORE_DOMAIN, "https://")
  : "";
const endpoint = `${domain}${SHOPIFY_GRAPHQL_API_ENDPOINT}`;
const key = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

function isShopifyConfigured() {
  return Boolean(process.env.SHOPIFY_STORE_DOMAIN && key);
}

function getStorefrontTokenIssue(): string | null {
  if (!key) return null;

  if (key.startsWith("shpat_")) {
    return (
      "SHOPIFY_STOREFRONT_ACCESS_TOKEN looks like an Admin API token (shpat_). " +
      "This app needs a Storefront API access token from Shopify Admin → Settings → Apps → Develop apps → your app → API credentials."
    );
  }

  return null;
}

function isUnauthorizedShopifyError(error: unknown) {
  return (
    isObject(error) &&
    "extensions" in error &&
    isObject(error.extensions) &&
    error.extensions.code === "UNAUTHORIZED"
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type ExtractVariables<T> = T extends { variables: object }
  ? T["variables"]
  : never;
export async function shopifyFetch<T>({
  cache,
  headers,
  query,
  revalidate,
  tags,
  variables,
}: {
  /** Use only for mutable cart/auth requests (`no-store` / `no-cache`). Do not combine with revalidate/tags. */
  cache?: RequestCache;
  headers?: HeadersInit;
  query: string;
  revalidate?: number;
  tags?: string[];
  variables?: ExtractVariables<T>;
}): Promise<{ status: number; body: T } | never> {
  if (!isShopifyConfigured()) {
    throw {
      cause: "missing-shopify-env",
      status: 500,
      message:
        "Shopify is not configured. Copy .env.sample to .env.local and set SHOPIFY_STORE_DOMAIN (your-store.myshopify.com) and SHOPIFY_STOREFRONT_ACCESS_TOKEN.",
      query,
    };
  }

  const tokenIssue = getStorefrontTokenIssue();
  if (tokenIssue) {
    console.error(tokenIssue);
  }

  const isUncached =
    cache === "no-store" || cache === "no-cache" || cache === "reload";

  // Prefer Next.js data cache via tags / revalidate. Never pair force-cache with revalidate.
  const fetchInit: RequestInit & {
    next?: { revalidate?: number | false; tags?: string[] };
  } = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": key,
      ...headers,
    },
    body: JSON.stringify({
      ...(query && { query }),
      ...(variables && { variables }),
    }),
  };

  if (isUncached) {
    fetchInit.cache = cache;
  } else {
    fetchInit.next = {
      ...(tags ? { tags } : {}),
      // Time-based fallback so catalog isn't stuck forever if a webhook is missed.
      revalidate: revalidate ?? 60,
    };
  }

  try {
    const result = await fetch(endpoint, fetchInit);

    const body = await result.json();

    if (body.errors) {
      const graphQLError = body.errors[0];

      if (isUnauthorizedShopifyError(graphQLError)) {
        throw {
          cause: "shopify-unauthorized",
          status: 401,
          message:
            getStorefrontTokenIssue() ||
            "Shopify rejected the Storefront API token. Regenerate a Storefront API access token in Shopify Admin and update SHOPIFY_STOREFRONT_ACCESS_TOKEN in .env.local.",
          query,
        };
      }

      throw graphQLError;
    }

    return {
      status: result.status,
      body,
    };
  } catch (error) {
    if (isShopifyError(error)) {
      throw {
        cause: error.cause?.toString() || "unknown",
        status: error.status || 500,
        message: error.message,
        query,
      };
    }

    throw {
      error,
      query,
    };
  }
}

function removeEdgesAndNodes<T>(array: Connection<T>): T[] {
  return array.edges.map((edge) => edge?.node);
}

function reshapeImages(images: Connection<Image>, productTitle: string) {
  const flattened = removeEdgesAndNodes(images);

  return flattened.map((image) => {
    const filename = image.url.match(/.*\/(.*)\..*/)?.[1];

    return {
      ...image,
      altText: image.altText || `${productTitle} - ${filename}`,
    };
  });
}
function parseReviewSummary(product: ShopifyProduct): ReviewSummary {
  let rating = 0;
  let reviewCount = 0;
  const badgeHtml = product.judgemeBadgeMetafield?.value || undefined;

  if (product.ratingMetafield?.value) {
    try {
      const parsed = JSON.parse(product.ratingMetafield.value);
      if (typeof parsed === "object" && parsed !== null && "value" in parsed) {
        rating = parseFloat(parsed.value) || 0;
      } else if (typeof parsed === "number") {
        rating = parsed;
      }
    } catch {
      rating = parseFloat(product.ratingMetafield.value) || 0;
    }
  }

  if (product.ratingCountMetafield?.value) {
    reviewCount = parseInt(product.ratingCountMetafield.value, 10) || 0;
  }

  if ((!rating || !reviewCount) && badgeHtml) {
    const avgMatch = badgeHtml.match(/data-average-rating=['"]([^'"]+)['"]/);
    const countMatch = badgeHtml.match(/data-number-of-reviews=['"]([^'"]+)['"]/);

    if (avgMatch && avgMatch[1] && !rating) {
      rating = parseFloat(avgMatch[1]) || 0;
    }
    if (countMatch && countMatch[1] && !reviewCount) {
      reviewCount = parseInt(countMatch[1], 10) || 0;
    }
  }

  return {
    rating: Number(rating.toFixed(1)),
    reviewCount,
    badgeHtml,
    widgetHtml: product.judgemeWidgetMetafield?.value || undefined,
    widgetData: product.judgemeWidgetDataMetafield?.value || undefined,
  };
}

function reshapeProduct(
  product: ShopifyProduct,
  filterHiddenProducts: boolean = true
) {
  if (
    !product ||
    (filterHiddenProducts && product.tags.includes(HIDDEN_PRODUCT_TAG))
  ) {
    return undefined;
  }

  const { images, variants, ...rest } = product;
  const reshapedImages = reshapeImages(images, product.title);
  const galleryImages =
    reshapedImages.length > 0
      ? reshapedImages
      : product.featuredImage?.url
        ? [
            {
              ...product.featuredImage,
              altText:
                product.featuredImage.altText ||
                `${product.title} - featured`,
            },
          ]
        : [];

  return {
    ...rest,
    images: galleryImages,
    variants: removeEdgesAndNodes(variants),
    collections: product.collections
      ? removeEdgesAndNodes(product.collections)
      : [],
    reviews: parseReviewSummary(product),
  };
}
function reshapeProducts(products: ShopifyProduct[]) {
  const reshapedProducts = [];

  for (const product of products) {
    if (product) {
      const reshapedProduct = reshapeProduct(product);

      if (reshapedProduct) {
        reshapedProducts.push(reshapedProduct);
      }
    }
  }

  return reshapedProducts;
}
export async function getMenu(handle: string): Promise<Menu[]> {
  if (!isShopifyConfigured()) {
    console.warn(
      "Shopify env vars are missing. Add SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN to .env.local"
    );
    return [];
  }

  try {
    const res = await shopifyFetch<ShopifyMenuOperation>({
      query: getMenuQuery,
      tags: [TAGS.collections],
      variables: {
        handle,
      },
    });

    const pages = await getPages().catch(() => []);
    const pagesByHandle = new Map(
      pages.map((page) => [page.handle.toLowerCase(), page.handle])
    );
    const pagesByTitle = new Map(
      pages.map((page) => [page.title.trim().toLowerCase(), page.handle])
    );

    const slugify = (value: string) =>
      value
        .trim()
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const reshapeMenuPath = (url: string, title: string) => {
      const raw = (url || "").trim();
      if (!raw || raw === "#" || raw === "/#") {
        const byTitle = pagesByTitle.get(title.trim().toLowerCase());
        if (byTitle) return `/${byTitle}`;

        const slug = slugify(title);
        if (slug && pagesByHandle.has(slug)) return `/${slug}`;

        return "";
      }

      let pathname = raw;

      try {
        if (/^https?:\/\//i.test(raw)) {
          pathname = new URL(raw).pathname || "/";
        }
      } catch {
        pathname = raw;
      }

      // Drop hash-only destinations
      if (pathname === "/" && raw.includes("#")) {
        const byTitle = pagesByTitle.get(title.trim().toLowerCase());
        if (byTitle) return `/${byTitle}`;
        const slug = slugify(title);
        if (slug && pagesByHandle.has(slug)) return `/${slug}`;
        return "";
      }

      pathname = pathname
        .replace(/\/collections\/all\/?$/i, "/search")
        .replace(/^\/collections/i, "/search")
        .replace(/^\/pages/i, "");

      // Keep Shopify policy URLs on /policies/[handle]
      const policyMatch = pathname.match(
        /^\/policies\/(privacy-policy|refund-policy|shipping-policy|terms-of-service)\/?$/i
      );
      if (policyMatch) {
        return `/policies/${policyMatch[1].toLowerCase()}`;
      }

      if (pathname === "/search/all") return "/search";
      if (pathname === "/search/faceoils" || pathname === "/search/faceoils/") return "/search/face-oils";
      if (pathname === "/search/bestsellers" || pathname === "/search/bestsellers/") return "/search/best-sellers";
      if (pathname === "/search/frontpage" || pathname === "/search/frontpage/") return "/search/featured";
      if (!pathname || pathname === "#") {
        const policyByTitle: Record<string, string> = {
          "privacy policy": "/policies/privacy-policy",
          "terms of service": "/policies/terms-of-service",
          "refund policy": "/policies/refund-policy",
          "shipping policy": "/policies/shipping-policy",
        };
        const titleKey = title.trim().toLowerCase();
        if (policyByTitle[titleKey]) return policyByTitle[titleKey];
        return "";
      }

      // Ensure leading slash for internal routes
      if (!pathname.startsWith("/")) {
        pathname = `/${pathname}`;
      }

      // Bare policy handles that used to 404 on /[page]
      if (
        [
          "/privacy-policy",
          "/refund-policy",
          "/shipping-policy",
          "/terms-of-service",
        ].includes(pathname)
      ) {
        return `/policies${pathname}`;
      }

      return pathname;
    };

    const reshapeMenuItem = (item: ShopifyMenuItem): Menu => ({
      title: item.title,
      path: reshapeMenuPath(item.url, item.title),
      items: item.items?.length
        ? item.items.map((child) => ({
            title: child.title,
            path: reshapeMenuPath(child.url, child.title),
          }))
        : undefined,
    });

    return res.body?.data?.menu?.items.map(reshapeMenuItem) || [];
  } catch (error) {
    console.error("Failed to load Shopify menu", error);
    return [];
  }
}

export async function getProducts({
  query,
  reverse,
  sortKey,
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  const res = await shopifyFetch<ShopifyProductsOperation>({
    query: getProductsQuery,
    tags: [TAGS.products],
    revalidate: 60,
    variables: {
      query,
      reverse,
      sortKey,
    },
  });

  return reshapeProducts(removeEdgesAndNodes(res.body.data.products));
}

function reshapeCollection(
  collection: ShopifyCollection
): Collection | undefined {
  if (!collection) return undefined;

  return {
    ...collection,
    path: `/collections/${collection.handle}`,
  };
}

function reshapeCollections(collections: ShopifyCollection[]) {
  const reshapedCollections = [];

  for (const collection of collections) {
    if (collection) {
      const reshapedCollection = reshapeCollection(collection);

      if (reshapedCollection) {
        reshapedCollections.push(reshapedCollection);
      }
    }
  }

  return reshapedCollections;
}

export async function getCollection(
  handle: string
): Promise<Collection | undefined> {
  if (!isShopifyConfigured()) {
    return undefined;
  }

  try {
    const res = await shopifyFetch<ShopifyCollectionOperation>({
      query: getCollectionQuery,
      tags: [TAGS.collections],
      variables: {
        handle,
      },
    });

    return reshapeCollection(res?.body?.data?.collection);
  } catch (error) {
    return undefined;
  }
}

export async function getCollections(): Promise<Collection[]> {
  const res = await shopifyFetch<ShopifyCollectionsOperation>({
    query: getCollectionsQuery,
    tags: [TAGS.collections],
  });

  const shopifyCollections = removeEdgesAndNodes(res?.body?.data?.collections);
  const collections = [
    {
      handle: "",
      title: "All",
      description: "All products",
      seo: {
        title: "All",
        description: "All products",
      },
      path: "/search",
      updatedAt: new Date().toISOString(),
    },
    // Filter out the hidden products
    ...reshapeCollections(shopifyCollections).filter(
      (collection) => !collection.handle.startsWith("hidden")
    ),
  ];

  return collections;
}

export async function getCollectionProducts({
  collection,
  reverse,
  sortKey,
}: {
  collection: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  if (!isShopifyConfigured()) {
    return [];
  }

  try {
    const collectionHandleMap: Record<string, string> = {
      faceoils: "face-oils",
      bestsellers: "best-sellers",
      frontpage: "featured",
    };
    const targetCollection = collectionHandleMap[collection] || collection;

    const normalizedSortKey =
      sortKey === "CREATED_AT" ? "CREATED" : sortKey;
    const variables: ShopifyCollectionProductsOperation["variables"] = {
      handle: targetCollection,
    };

    // Omit default relevance sorting so collection pages match homepage queries
    // and share the same fetch cache key.
    if (normalizedSortKey && normalizedSortKey !== "RELEVANCE") {
      variables.sortKey = normalizedSortKey;
      if (reverse !== undefined) {
        variables.reverse = reverse;
      }
    }

    const res = await shopifyFetch<ShopifyCollectionProductsOperation>({
      query: getCollectionProductsQuery,
      tags: [TAGS.collections, TAGS.products],
      revalidate: 60,
      variables,
    });

    if (!res.body.data.collection) {
      console.log(`No collection found for \`${collection}\``);
      return [];
    }

    return reshapeProducts(
      removeEdgesAndNodes(res.body.data.collection.products)
    );
  } catch (error) {
    console.error(`Failed to load collection \`${collection}\``, error);
    return [];
  }
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  const res = await shopifyFetch<ShopifyProductOperation>({
    query: getProductQuery,
    tags: [TAGS.products],
    revalidate: 300,
    variables: {
      handle,
    },
  });
  return reshapeProduct(res.body.data.product, false);
}

export async function getProductRecommendations(
  productId: string
): Promise<Product[]> {
  const res = await shopifyFetch<ShopifyProductRecommendationsOperation>({
    query: getProductRecommendationsQuery,
    tags: [TAGS.products],
    revalidate: 60,
    variables: {
      productId,
    },
  });

  return reshapeProducts(res.body.data.productRecommendations);
}

function reshapeCart(cart: ShopifyCart): Cart {
  if (!cart.cost?.totalTaxAmount) {
    cart.cost.totalTaxAmount = {
      amount: "0.0",
      currencyCode: "USD",
    };
  }

  return {
    ...cart,
    lines: removeEdgesAndNodes(cart.lines),
  };
}

export async function createCart(): Promise<Cart | undefined> {
  if (!isShopifyConfigured()) {
    return undefined;
  }

  try {
    const res = await shopifyFetch<ShopifyCreateCartOperation>({
      query: createCartMutation,
      cache: "no-store",
    });

    return reshapeCart(res.body.data.cartCreate.cart);
  } catch (error) {
    console.error("Failed to create Shopify cart", error);
    return undefined;
  }
}

export async function getCart(
  cartId: string | undefined
): Promise<Cart | undefined> {
  if (!cartId || !isShopifyConfigured()) return undefined;

  try {
    const res = await shopifyFetch<ShopifyCartOperation>({
      query: getCartQuery,
      variables: { cartId },
      tags: [TAGS.cart],
    });

    // old carts becomes 'null' when you checkout
    if (!res.body.data.cart) {
      return undefined;
    }

    return reshapeCart(res.body.data.cart);
  } catch (error) {
    console.error("Failed to load Shopify cart", error);
    return undefined;
  }
}

export async function removeFromCart(
  cartId: string,
  lineIds: string[]
): Promise<Cart> {
  const res = await shopifyFetch<ShopifyRemoveFromCartOperation>({
    query: removeFromCartMutation,
    variables: {
      cartId,
      lineIds,
    },
    cache: "no-store",
  });

  return reshapeCart(res.body.data.cartLinesRemove.cart);
}

export async function updateCart(
  cartId: string,
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const res = await shopifyFetch<ShopifyUpdateCartOperation>({
    query: editCartItemsMutation,
    variables: {
      cartId,
      lines,
    },
    cache: "no-store",
  });

  return reshapeCart(res.body.data.cartLinesUpdate.cart);
}

export async function addToCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const res = await shopifyFetch<ShopifyAddToCartOperation>({
    query: addToCartMutation,
    variables: {
      cartId,
      lines,
    },
    cache: "no-cache",
  });

  return reshapeCart(res.body.data.cartLinesAdd.cart);
}

// This is called from `app/api/revalidate.ts` so providers can control revalidation logic.
export async function revalidate(req: NextRequest): Promise<NextResponse> {
  // We always need to respond with a 200 status code to Shopify,
  // otherwise it will continue to retry the request.

  const collectionWebhooks = [
    "collections/create",
    "collections/delete",
    "collections/update",
  ];
  const productWebhooks = [
    "products/create",
    "products/delete",
    "products/update",
  ];
  const topic = headers().get("x-shopify-topic") || "unknown";
  const secret = req.nextUrl.searchParams.get("secret");
  const isCollectionUpdate = collectionWebhooks.includes(topic);
  const isProductUpdate = productWebhooks.includes(topic);

  if (!secret || secret !== process.env.SHOPIFY_REVALIDATION_SECRET) {
    console.error("Invalid revalidation secret.");
    return NextResponse.json({ status: 200 });
  }

  if (!isCollectionUpdate && !isProductUpdate) {
    // We don't need to revalidate anything for any other topics.
    return NextResponse.json({ status: 200 });
  }

  if (isCollectionUpdate) {
    revalidateTag(TAGS.collections);
  }

  if (isProductUpdate) {
    revalidateTag(TAGS.products);
    revalidateTag(TAGS.collections);
  }

  return NextResponse.json({ status: 200, revalidated: true, now: Date.now() });
}

export async function getPage(handle: string): Promise<Page> {
  const res = await shopifyFetch<ShopifyPageOperation>({
    query: getPageQuery,
    cache: "no-store",
    variables: { handle },
  });

  return res.body.data.pageByHandle;
}

export async function getPages(): Promise<Page[]> {
  const res = await shopifyFetch<ShopifyPagesOperation>({
    query: getPagesQuery,
    cache: "no-store",
  });

  return removeEdgesAndNodes(res.body.data.pages);
}

const POLICY_FIELD_BY_HANDLE = {
  "privacy-policy": "privacyPolicy",
  "refund-policy": "refundPolicy",
  "shipping-policy": "shippingPolicy",
  "terms-of-service": "termsOfService",
} as const;

export async function getShopPolicies(): Promise<ShopPolicy[]> {
  if (!isShopifyConfigured()) return [];

  try {
    const res = await shopifyFetch<ShopifyShopPoliciesOperation>({
      query: getShopPoliciesQuery,
      tags: [TAGS.collections],
    });

    const shop = res.body.data.shop;
    return [
      shop.privacyPolicy,
      shop.refundPolicy,
      shop.shippingPolicy,
      shop.termsOfService,
    ].filter((policy): policy is ShopPolicy => Boolean(policy?.body));
  } catch (error) {
    console.error("Failed to load Shopify policies", error);
    return [];
  }
}

export async function getPolicy(
  handle: string
): Promise<ShopPolicy | undefined> {
  const normalized = handle.toLowerCase();
  const field =
    POLICY_FIELD_BY_HANDLE[
      normalized as keyof typeof POLICY_FIELD_BY_HANDLE
    ];

  if (!field || !isShopifyConfigured()) return undefined;

  try {
    const res = await shopifyFetch<ShopifyShopPoliciesOperation>({
      query: getShopPoliciesQuery,
      tags: [TAGS.collections],
    });

    const policy = res.body.data.shop[field];
    if (!policy?.body) return undefined;

    return {
      ...policy,
      // Normalize handle so /policies/[handle] matching is stable
      handle: policy.handle || normalized,
    };
  } catch (error) {
    console.error(`Failed to load Shopify policy \`${normalized}\``, error);
    return undefined;
  }
}
