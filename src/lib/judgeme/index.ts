export type JudgeMeReviewer = {
  id?: number;
  name: string;
  email?: string;
  phone?: string | null;
  accepts_marketing?: boolean;
};

export type JudgeMeReview = {
  id: number;
  title: string | null;
  body: string;
  rating: number; // 1 - 5
  reviewer: JudgeMeReviewer;
  created_at: string;
  curated?: string;
  hidden?: boolean;
  verified?: string | null; // e.g. "buyer"
  pictures?: {
    urls: {
      original: string;
      small?: string;
      compact?: string;
      huge?: string;
    };
  }[];
  reply?: {
    id: number;
    body: string;
    created_at: string;
  } | null;
};

export type JudgeMeReviewsResponse = {
  current_page: number;
  per_page: number;
  reviews: JudgeMeReview[];
};

const JUDGEME_API_BASE = "https://judge.me/api/v1";

export function getJudgeMeConfig() {
  const privateToken =
    process.env.JUDGEME_PRIVATE_TOKEN ||
    process.env.NEXT_PUBLIC_JUDGEME_PUBLIC_TOKEN ||
    process.env.JUDGEME_PUBLIC_TOKEN ||
    "";
  const publicToken =
    process.env.NEXT_PUBLIC_JUDGEME_PUBLIC_TOKEN ||
    process.env.JUDGEME_PUBLIC_TOKEN ||
    "";
  const shopDomain =
    process.env.NEXT_PUBLIC_JUDGEME_SHOP_DOMAIN ||
    process.env.SHOPIFY_STORE_DOMAIN ||
    "rmnzsr-ty.myshopify.com";

  return {
    apiToken: privateToken || publicToken,
    publicToken,
    shopDomain: shopDomain.replace(/^https?:\/\//, ""),
  };
}

/**
 * Extract numeric product ID from Shopify GID (gid://shopify/Product/123456789)
 */
export function extractNumericShopifyId(id: string): string {
  if (!id) return "";
  const match = id.match(/\/Product\/(\d+)/) || id.match(/^(\d+)$/);
  return match ? match[1]! : id;
}

export type JudgeMeProduct = {
  id: number;
  external_id: number | string;
  handle: string;
  title: string;
};

/**
 * Fetch and cache products registered in Judge.me
 */
export async function getJudgeMeProducts(): Promise<JudgeMeProduct[]> {
  const { apiToken, shopDomain } = getJudgeMeConfig();

  if (!apiToken) return [];

  try {
    const res = await fetch(
      `${JUDGEME_API_BASE}/products?api_token=${apiToken}&shop_domain=${shopDomain}&per_page=100`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        next: {
          revalidate: 300, // 5 minutes cache
          tags: ["judgeme-products"],
        },
      }
    );

    if (!res.ok) return [];

    const data = (await res.json()) as { products?: JudgeMeProduct[] };
    const allProducts = data.products || [];
    // Only return live, active products in the store
    const activeProducts = allProducts.filter(
      (p) =>
        (p as { in_store?: boolean }).in_store !== false &&
        (p.handle === "anti-acne-medicated-soap" ||
          p.handle === "nourish-grow-hair-oil" ||
          (p as { in_store?: boolean }).in_store === true)
    );
    return activeProducts;
  } catch (error) {
    console.error("Error fetching Judge.me products:", error);
    return [];
  }
}

/**
 * Fetch reviews strictly for a specific product from Judge.me REST API.
 */
export async function getJudgeMeReviews({
  productHandle,
  productId,
  page = 1,
  perPage = 10,
}: {
  productHandle?: string;
  productId?: string;
  page?: number;
  perPage?: number;
}): Promise<JudgeMeReviewsResponse> {
  const { apiToken, shopDomain } = getJudgeMeConfig();

  if (!apiToken) {
    return {
      current_page: page,
      per_page: perPage,
      reviews: [],
    };
  }

  const numericId = productId ? extractNumericShopifyId(productId) : "";

  // Require a product identifier to avoid leaking store-wide reviews
  if (!productHandle && !numericId) {
    return {
      current_page: page,
      per_page: perPage,
      reviews: [],
    };
  }

  try {
    // Resolve the internal Judge.me product ID
    const products = await getJudgeMeProducts();
    const matchedProduct = products.find((p) => {
      if (
        productHandle &&
        p.handle?.toLowerCase() === productHandle.toLowerCase()
      ) {
        return true;
      }
      if (numericId && String(p.external_id) === String(numericId)) {
        return true;
      }
      return false;
    });

    if (!matchedProduct) {
      // Product not found in Judge.me or has no reviews registered
      return {
        current_page: page,
        per_page: perPage,
        reviews: [],
      };
    }

    const params = new URLSearchParams({
      api_token: apiToken,
      shop_domain: shopDomain,
      product_id: String(matchedProduct.id),
      page: String(page),
      per_page: String(perPage),
    });

    const res = await fetch(`${JUDGEME_API_BASE}/reviews?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 0,
        tags: [
          "judgeme-reviews",
          productHandle || numericId || String(matchedProduct.id),
        ],
      },
    });

    if (!res.ok) {
      console.warn(`Judge.me API returned status ${res.status}`);
      return { current_page: page, per_page: perPage, reviews: [] };
    }

    const data = (await res.json()) as {
      current_page?: number;
      per_page?: number;
      reviews?: (JudgeMeReview & {
        product_id?: number;
        product_handle?: string;
      })[];
    };

    const allReviews = (data.reviews ?? []).filter(
      (r) =>
        (r as { hidden?: boolean }).hidden !== true &&
        (r as { curated?: string }).curated !== "archived"
    );

    // Filter to ensure only reviews for this specific product are returned
    const productReviews = allReviews.filter((r) => {
      if (r.product_handle === "judgeme-shop-reviews") return false;
      if (r.product_id && r.product_id === matchedProduct.id) return true;
      if (r.product_handle && r.product_handle === matchedProduct.handle)
        return true;
      if (
        (r as { product_external_id?: number | string }).product_external_id &&
        String(
          (r as { product_external_id?: number | string }).product_external_id
        ) === String(matchedProduct.external_id)
      )
        return true;
      if (productHandle && r.product_handle === productHandle) return true;
      return false;
    });

    return {
      current_page: data.current_page ?? page,
      per_page: data.per_page ?? perPage,
      reviews: productReviews,
    };
  } catch (error) {
    console.error("Error fetching Judge.me reviews:", error);
    return {
      current_page: page,
      per_page: perPage,
      reviews: [],
    };
  }
}

export type EnrichedJudgeMeReview = JudgeMeReview & {
  product_id?: number;
  product_external_id?: number | string;
  product_handle?: string;
  product_title?: string;
  product_image_url?: string | null;
  is_shop_review?: boolean;
};

/**
 * Fetch all reviews store-wide (both product reviews and store/experience reviews)
 * with product enrichment for the dedicated /reviews hub.
 */
export async function getAllJudgeMeReviews({
  page = 1,
  perPage = 100,
}: {
  page?: number;
  perPage?: number;
} = {}): Promise<{
  reviews: EnrichedJudgeMeReview[];
  products: JudgeMeProduct[];
  stats: {
    totalCount: number;
    averageRating: number;
    productReviewCount: number;
    storeReviewCount: number;
  };
}> {
  const { apiToken, shopDomain } = getJudgeMeConfig();

  if (!apiToken) {
    return {
      reviews: [],
      products: [],
      stats: {
        totalCount: 0,
        averageRating: 0,
        productReviewCount: 0,
        storeReviewCount: 0,
      },
    };
  }

  try {
    const [products, reviewsRes] = await Promise.all([
      getJudgeMeProducts(),
      fetch(
        `${JUDGEME_API_BASE}/reviews?api_token=${apiToken}&shop_domain=${shopDomain}&page=${page}&per_page=${perPage}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          next: {
            revalidate: 0,
            tags: ["judgeme-all-reviews"],
          },
        }
      ),
    ]);

    if (!reviewsRes.ok) {
      return {
        reviews: [],
        products,
        stats: {
          totalCount: 0,
          averageRating: 0,
          productReviewCount: 0,
          storeReviewCount: 0,
        },
      };
    }

    const data = (await reviewsRes.json()) as {
      reviews?: (JudgeMeReview & {
        product_id?: number;
        product_external_id?: number | string;
        product_handle?: string;
        product_title?: string;
        hidden?: boolean;
        curated?: string;
      })[];
    };

    const rawReviews = (data.reviews || []).filter(
      (r) => r.hidden !== true && r.curated !== "archived"
    );

    const enrichedReviews: EnrichedJudgeMeReview[] = rawReviews.map((rev) => {
      // Strictly match Judge.me's recorded product_external_id / product_handle
      const isShop =
        !rev.product_external_id ||
        rev.product_external_id === 0 ||
        rev.product_external_id === "0" ||
        rev.product_handle === "judgeme-shop-reviews" ||
        !rev.product_handle;

      const matchedProd = !isShop
        ? products.find(
            (p) =>
              (rev.product_external_id &&
                String(p.external_id) === String(rev.product_external_id)) ||
              (rev.product_handle &&
                p.handle?.toLowerCase() === rev.product_handle.toLowerCase())
          )
        : undefined;

      const productImageUrl =
        (matchedProd as { image_url?: string | null })?.image_url ||
        (matchedProd?.handle === "anti-acne-medicated-soap"
          ? "https://cdn.shopify.com/s/files/1/1015/4806/5085/files/image_2026-08-22_002031970.png?v=1787340041"
          : matchedProd?.handle === "nourish-grow-hair-oil"
          ? "https://cdn.shopify.com/s/files/1/1015/4806/5085/files/image_2026-08-22_015321873.png?v=1787345612"
          : null);

      return {
        ...rev,
        is_shop_review: isShop,
        product_title:
          matchedProd?.title ||
          (isShop ? "MZ by LIORA Store & Delivery" : rev.product_title),
        product_handle:
          matchedProd?.handle || (isShop ? undefined : rev.product_handle),
        product_image_url: isShop ? null : productImageUrl,
      };
    });

    const totalCount = enrichedReviews.length;
    const averageRating =
      totalCount > 0
        ? Number(
            (
              enrichedReviews.reduce((acc, curr) => acc + curr.rating, 0) /
              totalCount
            ).toFixed(1)
          )
        : 0;

    const productReviewCount = enrichedReviews.filter(
      (r) => !r.is_shop_review
    ).length;
    const storeReviewCount = enrichedReviews.filter(
      (r) => r.is_shop_review
    ).length;

    return {
      reviews: enrichedReviews,
      products,
      stats: {
        totalCount,
        averageRating,
        productReviewCount,
        storeReviewCount,
      },
    };
  } catch (error) {
    console.error("Error fetching all Judge.me reviews:", error);
    return {
      reviews: [],
      products: [],
      stats: {
        totalCount: 0,
        averageRating: 0,
        productReviewCount: 0,
        storeReviewCount: 0,
      },
    };
  }
}

/**
 * Fetch a mapping of product handle -> review rating and count for product card enrichment.
 */
export async function getJudgeMeProductStatsMap(): Promise<
  Record<string, { rating: number; reviewCount: number }>
> {
  try {
    const { reviews, products } = await getAllJudgeMeReviews();
    const map: Record<string, { rating: number; reviewCount: number }> = {};

    for (const prod of products) {
      if (!prod.handle) continue;
      const prodReviews = reviews.filter(
        (r) => !r.is_shop_review && r.product_handle === prod.handle
      );
      const count = prodReviews.length;
      const rating =
        count > 0
          ? Number(
              (
                prodReviews.reduce((sum, r) => sum + r.rating, 0) / count
              ).toFixed(1)
            )
          : 0;

      if (count > 0 && rating > 0) {
        map[prod.handle] = { rating, reviewCount: count };
      }
    }

    return map;
  } catch {
    return {};
  }
}

/**
 * Post a new review via our server-side API route (/api/reviews/submit)
 * to avoid browser CORS restrictions and keep private tokens secure.
 */
export async function submitJudgeMeReview({
  productId,
  productHandle,
  name,
  email,
  rating,
  title,
  body,
  pictures,
}: {
  productId?: string;
  productHandle?: string;
  name: string;
  email: string;
  rating: number;
  title?: string;
  body: string;
  pictures?: string[];
}): Promise<{
  success: boolean;
  message?: string;
  uploadedPictures?: { urls: { small: string; original: string } }[];
}> {
  try {
    const res = await fetch("/api/reviews/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
        productHandle,
        name,
        email,
        rating,
        title,
        body,
        pictures,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
      return {
        success: false,
        message:
          data?.message ||
          "Something went wrong submitting your review, please try again.",
      };
    }

    return {
      success: true,
      message:
        data.message ||
        "Thank you! Your review has been submitted for moderation.",
      uploadedPictures: data.uploadedPictures || [],
    };
  } catch (error) {
    console.error("Failed to submit review via /api/reviews/submit:", error);
    return {
      success: false,
      message: "Something went wrong submitting your review, please try again.",
    };
  }
}
