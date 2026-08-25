import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  clearCustomerSessionCookies,
  COOKIE_ID_TOKEN,
  getCustomerAuthConfig,
} from "@/lib/customer/auth";
import { getSiteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}

async function handleLogout(request: NextRequest) {
  const cookieStore = cookies();
  const idToken = cookieStore.get(COOKIE_ID_TOKEN)?.value;
  const config = getCustomerAuthConfig();
  const siteUrl = getSiteUrl();

  // Clear local cookies first
  clearCustomerSessionCookies();

  // If idToken and shopId exist, redirect to Shopify hosted logout to end single-sign-on session
  if (idToken && config.shopId) {
    const logoutUrl = new URL(`https://shopify.com/${config.shopId}/auth/logout`);
    logoutUrl.searchParams.set("id_token_hint", idToken);
    logoutUrl.searchParams.set("post_logout_redirect_uri", config.postLogoutRedirectUri);
    return NextResponse.redirect(logoutUrl.toString());
  }

  return NextResponse.redirect(new URL("/?logged_out=1", siteUrl));
}
