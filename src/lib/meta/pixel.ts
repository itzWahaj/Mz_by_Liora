import type { MetaCustomData, MetaUserData } from "./capi";

declare global {
  interface Window {
    fbq?: {
      (
        action: "track" | "trackCustom" | "init",
        eventName: string,
        params?: Record<string, unknown>,
        options?: { eventID?: string }
      ): void;
      loaded?: boolean;
      version?: string;
      queue?: unknown[];
    };
    _fbq?: Window["fbq"];
  }
}

/**
 * Generates a standard UUIDv4 event ID for Meta deduplication.
 */
export function generateEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // RFC4122 v4 compliant fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Retrieves a cookie value by name from document.cookie.
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

export type TrackMetaEventOptions = {
  eventId?: string;
  customData?: MetaCustomData;
  userData?: MetaUserData;
  isCustomEvent?: boolean;
};

/**
 * Fires an event to both the browser Meta Pixel (fbq) and the server-side
 * Conversions API (/api/meta/events) using a shared event_id for deduplication.
 */
export function trackMetaEvent(
  eventName:
    | "PageView"
    | "ViewContent"
    | "AddToCart"
    | "InitiateCheckout"
    | "Purchase"
    | "Search"
    | "Contact"
    | "Lead"
    | string,
  options: TrackMetaEventOptions = {}
): string {
  const eventId = options.eventId || generateEventId();
  const customData = options.customData || {};
  const userData = options.userData || {};

  // 1. Client-Side Meta Pixel (browser)
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      const fbqAction = options.isCustomEvent ? "trackCustom" : "track";
      window.fbq(fbqAction, eventName, customData as Record<string, unknown>, {
        eventID: eventId,
      });
    } catch (err) {
      console.warn("[Meta Pixel Error]", err);
    }
  }

  // 2. Server-Side Conversions API (CAPI via proxy API route)
  if (typeof window !== "undefined") {
    try {
      const fbp = getCookie("_fbp");
      const fbc = getCookie("_fbc");

      const enrichedUserData: MetaUserData = {
        ...userData,
        fbp: fbp || userData.fbp,
        fbc: fbc || userData.fbc,
      };

      const payload = {
        event_name: eventName,
        event_id: eventId,
        event_source_url: window.location.href,
        custom_data: customData,
        user_data: enrichedUserData,
      };

      fetch("/api/meta/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch((err) => {
        // Silent failure so tracking never breaks UX
        if (process.env.NODE_ENV === "development") {
          console.warn("[Meta CAPI Dispatch Error]", err);
        }
      });
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Meta Tracking Error]", err);
      }
    }
  }

  return eventId;
}
