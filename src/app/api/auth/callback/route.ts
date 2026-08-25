import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  COOKIE_AUTH_RETURN_TO,
  COOKIE_AUTH_STATE,
  COOKIE_AUTH_VERIFIER,
  exchangeCodeForTokens,
  setCustomerSessionCookies,
} from "@/lib/customer/auth";
import { getSiteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const origin = request.nextUrl.origin || getSiteUrl();

  if (error) {
    console.error("Shopify OAuth callback error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/account/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(
          errorDescription || ""
        )}`,
        origin
      )
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/account/login?error=missing_code_or_state", origin)
    );
  }

  const cookieStore = cookies();
  const savedState = cookieStore.get(COOKIE_AUTH_STATE)?.value;
  const savedVerifier = cookieStore.get(COOKIE_AUTH_VERIFIER)?.value;
  const returnTo = cookieStore.get(COOKIE_AUTH_RETURN_TO)?.value || "/account";

  // CSRF validation
  if (!savedState || savedState !== state) {
    console.error("OAuth state mismatch in callback (CSRF check failed).");
    return NextResponse.redirect(
      new URL("/account/login?error=state_mismatch", origin)
    );
  }

  if (!savedVerifier) {
    console.error("Missing PKCE code verifier in cookies.");
    return NextResponse.redirect(
      new URL("/account/login?error=missing_verifier", origin)
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code, savedVerifier);
    setCustomerSessionCookies(tokens);

    // Clean destination redirect
    const destination = returnTo.startsWith("/") ? returnTo : "/account";
    return NextResponse.redirect(new URL(destination, origin));
  } catch (err) {
    console.error("Failed to exchange authorization code for tokens:", err);
    return NextResponse.redirect(
      new URL("/account/login?error=token_exchange_failed", origin)
    );
  }
}
