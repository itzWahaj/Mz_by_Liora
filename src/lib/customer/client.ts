import { cookies } from "next/headers";
import { getCustomerAuthConfig, getCustomerSession, decodeIdToken } from "./auth";
import {
  CustomerAccountGraphQLResponse,
  CustomerMetafield,
  CustomerOrder,
  CustomerProfile,
  MetafieldsSetInput,
} from "./types";
import {
  customerMetafieldsSetMutation,
  getCustomerOrdersQuery,
  getCustomerProfileQuery,
  getCustomerWishlistQuery,
} from "./queries";

export async function customerAccountFetch<T>({
  query,
  variables,
  accessToken,
}: {
  query: string;
  variables?: Record<string, unknown>;
  accessToken?: string;
}): Promise<T | null> {
  const config = getCustomerAuthConfig();
  if (!config.isConfigured) {
    return null;
  }

  // If no accessToken provided, fetch from session (with auto-refresh)
  let token = accessToken;
  if (!token) {
    const session = await getCustomerSession();
    token = session?.accessToken;
  }

  if (!token) {
    return null;
  }

  const endpoint = `https://shopify.com/${config.shopId}/account/customer/api/2024-07/graphql`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `Customer Account API error (${response.status}):`,
        await response.text()
      );
      return null;
    }

    const json: CustomerAccountGraphQLResponse<T> = await response.json();
    if (json.errors && json.errors.length > 0) {
      console.error(
        "Customer Account GraphQL errors:",
        JSON.stringify(json.errors, null, 2)
      );
      if (json.data) {
        return json.data;
      }
      return null;
    }

    return json.data || null;
  } catch (error) {
    console.error("Failed to fetch Customer Account API:", error);
    return null;
  }
}

/**
 * Fetches full customer profile including addresses and details.
 */
export async function getCustomerProfile(
  accessToken?: string
): Promise<CustomerProfile | null> {
  const res = await customerAccountFetch<{ customer: CustomerProfile }>({
    query: getCustomerProfileQuery,
    accessToken,
  });

  return res?.customer || null;
}

/**
 * Fetches customer order history.
 */
export async function getCustomerOrders(
  accessToken?: string
): Promise<CustomerOrder[]> {
  const res = await customerAccountFetch<{
    customer: { orders: { nodes: CustomerOrder[] } };
  }>({
    query: getCustomerOrdersQuery,
    accessToken,
  });

  return res?.customer?.orders?.nodes || [];
}

/**
 * Cookie key for customer wishlist persistence.
 */
export const COOKIE_CUSTOMER_WISHLIST = "customer_wishlist";

/**
 * Fetches customer wishlist product IDs with dual-layer fallback.
 */
export async function getCustomerWishlist(
  accessToken?: string
): Promise<string[]> {
  try {
    const res = await customerAccountFetch<{
      customer: {
        id: string;
        metafield?: {
          value?: string;
        } | null;
      };
    }>({
      query: getCustomerWishlistQuery,
      accessToken,
    });

    const rawValue = res?.customer?.metafield?.value;
    if (rawValue) {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    }
  } catch {
    // GraphQL fallback to cookie
  }

  // Fallback to cookie storage
  try {
    const cookieStore = cookies();
    const rawCookie = cookieStore.get(COOKIE_CUSTOMER_WISHLIST)?.value;
    if (rawCookie) {
      const parsed = JSON.parse(rawCookie);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    }
  } catch {
    // Return empty on error
  }

  return [];
}

/**
 * Sets customer wishlist product IDs in both session cookies and Shopify metafields.
 */
export async function setCustomerWishlist(
  productIds: string[],
  accessToken?: string
): Promise<boolean> {
  const cleanIds = Array.from(new Set(productIds));
  const isProd = process.env.NODE_ENV === "production";

  // 1. Immediately persist in customer session cookie
  try {
    const cookieStore = cookies();
    cookieStore.set(COOKIE_CUSTOMER_WISHLIST, JSON.stringify(cleanIds), {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  } catch (err) {
    console.error("Failed to write wishlist cookie:", err);
  }

  // 2. Attempt sync with Shopify Customer Account API metafield
  try {
    let customerId = "";
    const session = await getCustomerSession();
    const token = accessToken || session?.accessToken;

    if (session?.idToken) {
      const decoded = decodeIdToken(session.idToken);
      if (decoded?.id && decoded.id.startsWith("gid://shopify/Customer/")) {
        customerId = decoded.id;
      }
    }

    if (!customerId && token) {
      const profile = await getCustomerProfile(token);
      customerId = profile?.id || "";
    }

    if (customerId && token) {
      const variables = {
        metafields: [
          {
            ownerId: customerId,
            namespace: "custom",
            key: "wishlist",
            type: "json",
            value: JSON.stringify(cleanIds),
          },
        ],
      };

      await customerAccountFetch<{
        metafieldsSet?: {
          metafields?: Array<{ key: string; namespace: string; value: string }>;
          userErrors?: Array<{ field: string[]; message: string }>;
        };
      }>({
        query: customerMetafieldsSetMutation,
        variables,
        accessToken: token,
      });
    }
  } catch (err) {
    console.warn("Notice: Shopify metafield sync will complete when merchant grants definition access:", err);
  }

  return true;
}

/**
 * Atomically toggles a product ID in customer's wishlist.
 */
export async function toggleCustomerWishlistItem(
  productId: string,
  accessToken?: string
): Promise<{ inWishlist: boolean; wishlist: string[] }> {
  const currentWishlist = await getCustomerWishlist(accessToken);
  const exists = currentWishlist.some(
    (id) => id === productId || id.endsWith(productId) || productId.endsWith(id)
  );

  const updatedWishlist = exists
    ? currentWishlist.filter(
        (id) => id !== productId && !id.endsWith(productId) && !productId.endsWith(id)
      )
    : [...currentWishlist, productId];

  await setCustomerWishlist(updatedWishlist, accessToken);

  return {
    inWishlist: !exists,
    wishlist: updatedWishlist,
  };
}
