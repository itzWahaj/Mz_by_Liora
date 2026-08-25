import { getCustomerAuthConfig, getCustomerSession } from "./auth";
import {
  CustomerAccountGraphQLResponse,
  CustomerOrder,
  CustomerProfile,
} from "./types";
import { getCustomerOrdersQuery, getCustomerProfileQuery } from "./queries";

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

  const endpoint = `https://shopify.com/${config.shopId}/account/customer/api/2024-07/graphql.json`;

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
      console.error("Customer Account GraphQL errors:", json.errors);
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
