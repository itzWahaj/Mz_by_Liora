import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizationUrl, getCustomerAuthConfig } from "@/lib/customer/auth";
import { getSiteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get("returnTo") || "/account";

  const config = getCustomerAuthConfig();
  if (!config.isConfigured) {
    const siteUrl = getSiteUrl();
    return NextResponse.redirect(
      new URL("/account/login?error=not_configured", siteUrl)
    );
  }

  try {
    const { url } = buildAuthorizationUrl(returnTo);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Failed to initiate Shopify OAuth login:", error);
    const siteUrl = getSiteUrl();
    return NextResponse.redirect(
      new URL("/account/login?error=auth_init_failed", siteUrl)
    );
  }
}
