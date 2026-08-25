import crypto from "crypto";

export type MetaUserData = {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  externalId?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
};

export type MetaContentItem = {
  id: string;
  quantity?: number;
  item_price?: number;
  title?: string;
};

export type MetaCustomData = {
  value?: number | null;
  currency?: string | null;
  content_name?: string | null;
  content_category?: string | null;
  content_ids?: string[] | null;
  contents?: MetaContentItem[] | null;
  content_type?: "product" | "product_group" | null;
  num_items?: number | null;
  order_id?: string | null;
  search_string?: string | null;
  status?: string | null;
};

export type MetaCapiEventPayload = {
  event_name:
    | "PageView"
    | "ViewContent"
    | "AddToCart"
    | "InitiateCheckout"
    | "Purchase"
    | "Search"
    | "Contact"
    | "Lead"
    | string;
  event_time?: number; // Unix timestamp in seconds
  event_id: string; // Unique UUID for deduplication with browser Pixel
  event_source_url?: string;
  action_source?: "website" | "app" | "physical_store" | "system_generated" | "other";
  user_data?: MetaUserData;
  custom_data?: MetaCustomData;
  test_event_code?: string | null;
};

/**
 * Normalizes and hashes PII using SHA-256 per Meta Conversions API specifications.
 * Meta guidelines:
 * - Trim leading/trailing whitespace
 * - Convert to lowercase
 * - For phone: remove all non-digits (preserving country code)
 * - For name/city/state/country: remove punctuation and lowercase
 */
export function hashSha256(value: string | undefined | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export function hashPhoneSha256(phone: string | undefined | null): string | null {
  if (!phone) return null;
  // Keep only numeric characters
  const digitsOnly = phone.replace(/\D/g, "");
  if (!digitsOnly) return null;
  return crypto.createHash("sha256").update(digitsOnly).digest("hex");
}

/**
 * Formats user data for Meta CAPI payload with proper SHA-256 hashing.
 */
export function formatUserDataForCapi(userData?: MetaUserData) {
  if (!userData) return {};

  const payload: Record<string, unknown> = {};

  if (userData.email) {
    const hashed = hashSha256(userData.email);
    if (hashed) payload.em = [hashed];
  }

  if (userData.phone) {
    const hashed = hashPhoneSha256(userData.phone);
    if (hashed) payload.ph = [hashed];
  }

  if (userData.firstName) {
    const hashed = hashSha256(userData.firstName);
    if (hashed) payload.fn = [hashed];
  }

  if (userData.lastName) {
    const hashed = hashSha256(userData.lastName);
    if (hashed) payload.ln = [hashed];
  }

  if (userData.city) {
    const hashed = hashSha256(userData.city);
    if (hashed) payload.ct = [hashed];
  }

  if (userData.state) {
    const hashed = hashSha256(userData.state);
    if (hashed) payload.st = [hashed];
  }

  if (userData.zip) {
    const hashed = hashSha256(userData.zip);
    if (hashed) payload.zp = [hashed];
  }

  if (userData.country) {
    const hashed = hashSha256(userData.country);
    if (hashed) payload.country = [hashed];
  }

  if (userData.externalId) {
    const hashed = hashSha256(userData.externalId);
    if (hashed) payload.external_id = [hashed];
  }

  if (userData.clientIpAddress) {
    payload.client_ip_address = userData.clientIpAddress;
  }

  if (userData.clientUserAgent) {
    payload.client_user_agent = userData.clientUserAgent;
  }

  if (userData.fbp) {
    payload.fbp = userData.fbp;
  }

  if (userData.fbc) {
    payload.fbc = userData.fbc;
  }

  return payload;
}

/**
 * Sends one or more events to Meta Conversions API (v21.0).
 */
export async function sendMetaCapiEvents(
  events: MetaCapiEventPayload[],
  testEventCodeOverride?: string | null
): Promise<{ success: boolean; events_received?: number; fbtrace_id?: string; error?: string }> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  const defaultTestCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
  const testCode = testEventCodeOverride || defaultTestCode;

  if (!pixelId || !accessToken) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Meta CAPI] NEXT_PUBLIC_META_PIXEL_ID or META_CAPI_ACCESS_TOKEN is not configured. Event skipped:",
        events.map((e) => e.event_name)
      );
    }
    return { success: false, error: "Meta Pixel ID or CAPI Access Token not configured" };
  }

  const endpoint = `https://graph.facebook.com/v21.0/${pixelId}/events`;

  const formattedEvents = events.map((event) => {
    const eventTime = event.event_time || Math.floor(Date.now() / 1000);
    const userData = formatUserDataForCapi(event.user_data);

    const formattedEvent: Record<string, unknown> = {
      event_name: event.event_name,
      event_time: eventTime,
      event_id: event.event_id,
      event_source_url: event.event_source_url || (typeof window !== "undefined" ? window.location.href : undefined),
      action_source: event.action_source || "website",
      user_data: userData,
    };

    if (event.custom_data) {
      const cleanCustomData: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(event.custom_data)) {
        if (val !== undefined && val !== null) {
          cleanCustomData[key] = val;
        }
      }
      formattedEvent.custom_data = cleanCustomData;
    }

    return formattedEvent;
  });

  const requestBody: Record<string, unknown> = {
    data: formattedEvents,
  };

  if (testCode) {
    requestBody.test_event_code = testCode;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[Meta CAPI Error]", response.status, result);
      return {
        success: false,
        error: result?.error?.message || `Meta CAPI request failed with status ${response.status}`,
        fbtrace_id: result?.error?.fbtrace_id,
      };
    }

    return {
      success: true,
      events_received: result.events_received,
      fbtrace_id: result.fbtrace_id,
    };
  } catch (error) {
    console.error("[Meta CAPI Network Error]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown network error",
    };
  }
}

/**
 * Convenience wrapper for a single event.
 */
export async function sendMetaCapiEvent(
  event: MetaCapiEventPayload,
  testEventCodeOverride?: string | null
) {
  return sendMetaCapiEvents([event], testEventCodeOverride);
}
