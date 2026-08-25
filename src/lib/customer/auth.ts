import { cookies } from "next/headers";
import { getSiteUrl } from "../utils";
import { generateCodeChallenge, generateCodeVerifier, generateRandomString } from "./pkce";
import { CustomerTokens, CustomerSession } from "./types";

export const COOKIE_ACCESS_TOKEN = "customer_access_token";
export const COOKIE_REFRESH_TOKEN = "customer_refresh_token";
export const COOKIE_ID_TOKEN = "customer_id_token";
export const COOKIE_EXPIRES_AT = "customer_token_expires_at";

export const COOKIE_AUTH_STATE = "shopify_auth_state";
export const COOKIE_AUTH_VERIFIER = "shopify_auth_verifier";
export const COOKIE_AUTH_RETURN_TO = "shopify_auth_return_to";
export const COOKIE_AUTH_REDIRECT_URI = "shopify_auth_redirect_uri";

const DEFAULT_SCOPES = [
  "openid",
  "email",
  "customer-account-api:full",
].join(" ");

export function getCustomerAuthConfig(origin?: string) {
  const shopId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_SHOP_ID?.trim() || "";
  const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID?.trim() || "";
  const siteUrl = origin || getSiteUrl();
  const redirectUri = `${siteUrl}/api/auth/callback`;
  const postLogoutRedirectUri = siteUrl;

  const isConfigured = Boolean(shopId && clientId);

  return {
    shopId,
    clientId,
    siteUrl,
    redirectUri,
    postLogoutRedirectUri,
    isConfigured,
  };
}

/**
 * Builds the Shopify Customer Account API hosted authorization URL.
 * Also stores state, verifier, and return path in temporary cookies.
 */
export function buildAuthorizationUrl(returnTo = "/account", origin?: string): {
  url: string;
  state: string;
  codeVerifier: string;
} {
  const config = getCustomerAuthConfig(origin);
  if (!config.isConfigured) {
    throw new Error(
      "Shopify Customer Account API is not configured. Please set SHOPIFY_CUSTOMER_ACCOUNT_SHOP_ID and SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID."
    );
  }

  const state = generateRandomString(32);
  const nonce = generateRandomString(32);
  const codeVerifier = generateCodeVerifier(64);
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const authUrl = new URL(`https://shopify.com/authentication/${config.shopId}/oauth/authorize`);
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", config.redirectUri);
  authUrl.searchParams.set("scope", DEFAULT_SCOPES);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("nonce", nonce);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  // Store temporary PKCE cookies
  const cookieStore = cookies();
  const isProd = process.env.NODE_ENV === "production";
  const tempCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  };

  cookieStore.set(COOKIE_AUTH_STATE, state, tempCookieOptions);
  cookieStore.set(COOKIE_AUTH_VERIFIER, codeVerifier, tempCookieOptions);
  cookieStore.set(COOKIE_AUTH_RETURN_TO, returnTo, tempCookieOptions);
  cookieStore.set(COOKIE_AUTH_REDIRECT_URI, config.redirectUri, tempCookieOptions);

  return {
    url: authUrl.toString(),
    state,
    codeVerifier,
  };
}

/**
 * Exchanges the OAuth authorization code for customer tokens via Shopify token endpoint.
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUriOverride?: string
): Promise<CustomerTokens> {
  const cookieStore = cookies();
  const savedRedirectUri = cookieStore.get(COOKIE_AUTH_REDIRECT_URI)?.value;
  const config = getCustomerAuthConfig();
  const redirectUri = redirectUriOverride || savedRedirectUri || config.redirectUri;
  const tokenEndpoint = `https://shopify.com/authentication/${config.shopId}/oauth/token`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    redirect_uri: redirectUri,
    code,
    code_verifier: codeVerifier,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 3600;
  const expiresAt = Date.now() + expiresIn * 1000;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
    expiresIn,
    expiresAt,
  };
}

/**
 * Refreshes an expired customer access token using the refresh token.
 */
export async function refreshCustomerAccessToken(
  refreshToken: string
): Promise<CustomerTokens | null> {
  const config = getCustomerAuthConfig();
  const tokenEndpoint = `https://shopify.com/authentication/${config.shopId}/oauth/token`;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.clientId,
    refresh_token: refreshToken,
  });

  try {
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 3600;
    const expiresAt = Date.now() + expiresIn * 1000;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      idToken: data.id_token,
      expiresIn,
      expiresAt,
    };
  } catch (error) {
    console.error("Error refreshing customer access token:", error);
    return null;
  }
}

/**
 * Stores customer tokens in secure httpOnly cookies.
 */
export function setCustomerSessionCookies(tokens: CustomerTokens) {
  const cookieStore = cookies();
  const isProd = process.env.NODE_ENV === "production";

  // Access token cookie (valid for ~1 hour)
  cookieStore.set(COOKIE_ACCESS_TOKEN, tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: tokens.expiresIn,
  });

  // Refresh token cookie (long-lived, 30 days)
  cookieStore.set(COOKIE_REFRESH_TOKEN, tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  if (tokens.idToken) {
    cookieStore.set(COOKIE_ID_TOKEN, tokens.idToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  cookieStore.set(COOKIE_EXPIRES_AT, tokens.expiresAt.toString(), {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  // Clean up temporary PKCE cookies
  cookieStore.delete(COOKIE_AUTH_STATE);
  cookieStore.delete(COOKIE_AUTH_VERIFIER);
}

/**
 * Clears all customer session cookies upon logout.
 */
export function clearCustomerSessionCookies() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_ACCESS_TOKEN);
  cookieStore.delete(COOKIE_REFRESH_TOKEN);
  cookieStore.delete(COOKIE_ID_TOKEN);
  cookieStore.delete(COOKIE_EXPIRES_AT);
  cookieStore.delete(COOKIE_AUTH_STATE);
  cookieStore.delete(COOKIE_AUTH_VERIFIER);
  cookieStore.delete(COOKIE_AUTH_RETURN_TO);
}

/**
 * Retrieves the current customer session.
 * Automatically performs silent token refresh if the access token has expired.
 */
export async function getCustomerSession(): Promise<CustomerSession | null> {
  const cookieStore = cookies();
  const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;
  const refreshToken = cookieStore.get(COOKIE_REFRESH_TOKEN)?.value;
  const idToken = cookieStore.get(COOKIE_ID_TOKEN)?.value;
  const expiresAtStr = cookieStore.get(COOKIE_EXPIRES_AT)?.value;
  const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;

  const now = Date.now();
  const bufferTime = 60 * 1000; // 1 minute safety buffer

  // If valid access token exists and not expired
  if (accessToken && expiresAt > now + bufferTime) {
    return {
      accessToken,
      expiresAt,
      idToken,
    };
  }

  // If access token is expired or missing, but we have a refresh token -> silent refresh
  if (refreshToken) {
    const refreshedTokens = await refreshCustomerAccessToken(refreshToken);
    if (refreshedTokens) {
      setCustomerSessionCookies(refreshedTokens);
      return {
        accessToken: refreshedTokens.accessToken,
        expiresAt: refreshedTokens.expiresAt,
        idToken: refreshedTokens.idToken || idToken,
      };
    }
  }

  // Session is completely expired
  return null;
}

/**
 * Decodes the JWT payload from an OpenID Connect ID Token without external dependencies.
 */
export function decodeIdToken(idToken: string): {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
} | null {
  try {
    const parts = idToken.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = Buffer.from(base64, "base64").toString("utf-8");
    const payload = JSON.parse(jsonStr);

    const email = payload.email || "";
    const firstName = payload.given_name || (payload.name ? payload.name.split(" ")[0] : "");
    const lastName = payload.family_name || (payload.name ? payload.name.split(" ").slice(1).join(" ") : "");
    const displayName =
      payload.name ||
      [firstName, lastName].filter(Boolean).join(" ") ||
      (email ? email.split("@")[0] : "") ||
      "Valued Customer";

    return {
      id: payload.sub || "customer",
      email,
      firstName,
      lastName,
      displayName,
    };
  } catch (err) {
    console.error("Failed to decode ID token:", err);
    return null;
  }
}
