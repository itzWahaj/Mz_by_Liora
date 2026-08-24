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
      small: string;
      compact: string;
      huge: string;
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

/**
 * Fetch reviews for a product from Judge.me REST API.
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
  const params = new URLSearchParams({
    api_token: apiToken,
    shop_domain: shopDomain,
    page: String(page),
    per_page: String(perPage),
  });

  if (productHandle) {
    params.set("handle", productHandle);
  } else if (numericId && numericId.length < 12) {
    params.set("product_id", numericId);
  }

  try {
    const res = await fetch(`${JUDGEME_API_BASE}/reviews?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 60, // Next.js cache 60s
        tags: ["judgeme-reviews", productHandle || numericId || "reviews"],
      },
    });

    if (!res.ok) {
      console.warn(`Judge.me API returned status ${res.status}`);
      return { current_page: page, per_page: perPage, reviews: [] };
    }

    const data = (await res.json()) as {
      current_page?: number;
      per_page?: number;
      reviews?: JudgeMeReview[];
    };

    return {
      current_page: data.current_page ?? page,
      per_page: data.per_page ?? perPage,
      reviews: data.reviews ?? [],
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
}: {
  productId?: string;
  productHandle?: string;
  name: string;
  email: string;
  rating: number;
  title?: string;
  body: string;
}): Promise<{ success: boolean; message?: string }> {
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
    };
  } catch (error) {
    console.error("Failed to submit review via /api/reviews/submit:", error);
    return {
      success: false,
      message: "Something went wrong submitting your review, please try again.",
    };
  }
}
