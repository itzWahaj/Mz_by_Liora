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
 * Fetches customer wishlist product IDs from metafields.
 */
export async function getCustomerWishlist(
  accessToken?: string
): Promise<string[]> {
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
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Sets customer wishlist product IDs in metafields.
 */
export async function setCustomerWishlist(
  productIds: string[],
  accessToken?: string
): Promise<boolean> {
  // First retrieve the customer ID
  let customerId = "";
  const session = await getCustomerSession();
  const token = accessToken || session?.accessToken;
  if (!token) return false;

  if (session?.idToken) {
    const decoded = decodeIdToken(session.idToken);
    if (decoded?.id && decoded.id.startsWith("gid://shopify/Customer/")) {
      customerId = decoded.id;
    }
  }

  if (!customerId) {
    const profile = await getCustomerProfile(token);
    customerId = profile?.id || "";
  }

  if (!customerId) {
    console.error("Unable to resolve customerId for wishlist update.");
    return false;
  }

  const cleanIds = Array.from(new Set(productIds));
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

  const res = await customerAccountFetch<{
    metafieldsSet?: {
      metafields?: Array<{ key: string; namespace: string; value: string }>;
      userErrors?: Array<{ field: string[]; message: string }>;
    };
  }>({
    query: customerMetafieldsSetMutation,
    variables,
    accessToken: token,
  });

  if (res?.metafieldsSet?.userErrors && res.metafieldsSet.userErrors.length > 0) {
    console.error("metafieldsSet userErrors:", res.metafieldsSet.userErrors);
    return false;
  }

  return Boolean(res?.metafieldsSet?.metafields?.length);
}

/**
 * Atomically toggles a product ID in customer's wishlist.
 */
export async function toggleCustomerWishlistItem(
  productId: string,
  accessToken?: string
): Promise<{ inWishlist: boolean; wishlist: string[] }> {
  const currentWishlist = await getCustomerWishlist(accessToken);
  const exists = currentWishlist.includes(productId);

  const updatedWishlist = exists
    ? currentWishlist.filter((id) => id !== productId)
    : [...currentWishlist, productId];

  const success = await setCustomerWishlist(updatedWishlist, accessToken);
  if (!success) {
    throw new Error("Failed to update wishlist on Shopify Customer Account API");
  }

  return {
    inWishlist: !exists,
    wishlist: updatedWishlist,
  };
}
