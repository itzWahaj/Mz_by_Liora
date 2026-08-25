import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendMetaCapiEvent, type MetaCapiEventPayload, type MetaContentItem } from "@/lib/meta/capi";

export const runtime = "nodejs";

// In-memory cache for idempotency deduplication (keeps last 2,000 processed order IDs)
const processedOrderIds = new Map<string, number>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function isOrderAlreadyProcessed(orderId: string): boolean {
  const now = Date.now();
  // Clean up expired entries periodically
  if (processedOrderIds.size > 2000) {
    for (const [id, timestamp] of processedOrderIds.entries()) {
      if (now - timestamp > IDEMPOTENCY_TTL_MS) {
        processedOrderIds.delete(id);
      }
    }
  }

  if (processedOrderIds.has(orderId)) {
    return true;
  }

  processedOrderIds.set(orderId, now);
  return false;
}

/**
 * Validates Shopify Webhook HMAC SHA-256 signature.
 */
function verifyShopifyHmac(rawBody: string, hmacHeader: string | null, secret: string): boolean {
  if (!hmacHeader || !secret) return false;

  try {
    const generatedHmac = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("base64");

    const headerBuffer = Buffer.from(hmacHeader, "base64");
    const generatedBuffer = Buffer.from(generatedHmac, "base64");

    if (headerBuffer.length !== generatedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(headerBuffer, generatedBuffer);
  } catch (err) {
    console.error("[Shopify Webhook HMAC Verification Error]", err);
    return false;
  }
}

interface ShopifyOrderLineItem {
  id?: number;
  product_id?: number | null;
  variant_id?: number | null;
  title?: string;
  quantity?: number;
  price?: string;
}

interface ShopifyAddress {
  first_name?: string;
  last_name?: string;
  city?: string;
  province?: string;
  zip?: string;
  country_code?: string;
  phone?: string;
}

interface ShopifyOrderPayload {
  id: number | string;
  name?: string;
  order_number?: number;
  token?: string;
  checkout_token?: string;
  financial_status?: string;
  total_price?: string;
  current_total_price?: string;
  subtotal_price?: string;
  currency?: string;
  presentment_currency?: string;
  email?: string;
  contact_email?: string;
  phone?: string;
  browser_ip?: string;
  landing_site?: string;
  order_status_url?: string;
  customer?: {
    id?: number;
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
  };
  billing_address?: ShopifyAddress;
  shipping_address?: ShopifyAddress;
  client_details?: {
    browser_ip?: string;
    user_agent?: string;
  };
  line_items?: ShopifyOrderLineItem[];
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
    const topic = req.headers.get("x-shopify-topic");
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET?.trim();

    // Verify HMAC signature if secret is configured
    if (webhookSecret) {
      const isValid = verifyShopifyHmac(rawBody, hmacHeader, webhookSecret);
      if (!isValid) {
        console.warn("[Shopify Webhook] Invalid HMAC signature for topic:", topic);
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === "production") {
      console.warn("[Shopify Webhook] SHOPIFY_WEBHOOK_SECRET is not configured in production.");
    }

    const order: ShopifyOrderPayload = JSON.parse(rawBody);

    if (!order || !order.id) {
      return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
    }

    const orderKey = order.id.toString();

    // Idempotency check: prevent duplicate Purchase events if webhook is retried or multi-fired
    if (isOrderAlreadyProcessed(orderKey)) {
      return NextResponse.json({
        success: true,
        message: "Order already processed for CAPI Purchase",
        order_id: order.name || orderKey,
        deduplicated: true,
      });
    }

    // Safeguard: Only fire Purchase for paid/confirmed orders (ignore voided, refunded, or unpaid draft creations)
    const financialStatus = (order.financial_status || "").toLowerCase();
    if (
      financialStatus === "voided" ||
      financialStatus === "refunded" ||
      (topic === "orders/create" && financialStatus !== "paid" && financialStatus !== "authorized")
    ) {
      return NextResponse.json({
        success: true,
        message: `Skipped CAPI Purchase for non-paid financial_status: ${financialStatus || "pending"} on topic: ${topic}`,
        order_id: order.name || orderKey,
        skipped: true,
      });
    }

    // Extract Order Financials & Currency (real order values from Shopify payload)
    const value = parseFloat(
      order.total_price || order.current_total_price || order.subtotal_price || "0"
    );
    const currency = order.currency || order.presentment_currency || "PKR";

    // Extract Line Items
    const lineItems = order.line_items || [];
    const contentIds: string[] = [];
    const contents: MetaContentItem[] = [];
    let numItems = 0;

    for (const item of lineItems) {
      const id = (item.product_id || item.variant_id || item.id)?.toString();
      const qty = item.quantity || 1;
      const price = item.price ? parseFloat(item.price) : undefined;

      if (id) contentIds.push(id);
      numItems += qty;

      if (id) {
        contents.push({
          id,
          quantity: qty,
          item_price: price,
          title: item.title,
        });
      }
    }

    // Extract Customer Information for SHA-256 PII Hashing
    const email =
      order.email || order.contact_email || order.customer?.email || undefined;
    const phone =
      order.phone ||
      order.customer?.phone ||
      order.shipping_address?.phone ||
      order.billing_address?.phone ||
      undefined;
    const firstName =
      order.customer?.first_name ||
      order.shipping_address?.first_name ||
      order.billing_address?.first_name ||
      undefined;
    const lastName =
      order.customer?.last_name ||
      order.shipping_address?.last_name ||
      order.billing_address?.last_name ||
      undefined;
    const city =
      order.shipping_address?.city || order.billing_address?.city || undefined;
    const state =
      order.shipping_address?.province || order.billing_address?.province || undefined;
    const zip =
      order.shipping_address?.zip || order.billing_address?.zip || undefined;
    const country =
      order.shipping_address?.country_code ||
      order.billing_address?.country_code ||
      undefined;
    const clientIp =
      order.browser_ip || order.client_details?.browser_ip || undefined;
    const clientUserAgent = order.client_details?.user_agent || undefined;

    // Use order ID or token as event_id for deduplication
    const eventId = `order_${order.id}`;
    const orderIdentifier = order.name || order.order_number?.toString() || order.id.toString();

    const purchaseEvent: MetaCapiEventPayload = {
      event_name: "Purchase",
      event_id: eventId,
      event_source_url: order.order_status_url || order.landing_site || undefined,
      action_source: "website",
      user_data: {
        email,
        phone,
        firstName,
        lastName,
        city,
        state,
        zip,
        country,
        clientIpAddress: clientIp,
        clientUserAgent,
      },
      custom_data: {
        value,
        currency,
        content_type: "product",
        content_ids: contentIds.length > 0 ? contentIds : undefined,
        contents: contents.length > 0 ? contents : undefined,
        num_items: numItems > 0 ? numItems : 1,
        order_id: orderIdentifier,
      },
    };

    const result = await sendMetaCapiEvent(purchaseEvent);

    return NextResponse.json({
      success: result.success,
      event_id: eventId,
      order_id: orderIdentifier,
      events_received: result.events_received,
    });
  } catch (error) {
    console.error("[Shopify Order Webhook Error]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
