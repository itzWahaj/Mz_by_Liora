import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizationUrl, getCustomerAuthConfig } from "@/lib/customer/auth";
import { getSiteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get("returnTo") || "/account";

  const origin = request.nextUrl.origin || getSiteUrl();
  const config = getCustomerAuthConfig(origin);
  if (!config.isConfigured) {
    return NextResponse.redirect(
      new URL("/account/login?error=not_configured", origin)
    );
  }

  try {
    const { url } = buildAuthorizationUrl(returnTo, origin);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Failed to initiate Shopify OAuth login:", error);
    return NextResponse.redirect(
      new URL("/account/login?error=auth_init_failed", origin)
    );
  }
}
