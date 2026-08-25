import Link from "next/link";
import { getCustomerAuthConfig, getCustomerSession } from "@/lib/customer/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import {
  LockClosedIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Customer Login | MZ by LIORA",
  description: "Sign in securely to your MZ by LIORA account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; error_description?: string; returnTo?: string };
}) {
  const session = await getCustomerSession();
  const returnTo = searchParams.returnTo || "/account";

  if (session?.accessToken) {
    redirect(returnTo);
  }

  const config = getCustomerAuthConfig();
  const error = searchParams.error;

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-[#FAF9F4] px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-3xl border border-[#D8BB7A]/60 bg-[#FFFDF8] p-8 sm:p-10 shadow-lg text-center">
          {/* Background Glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#D8BB7A]/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-[#596522]/15 blur-2xl" />

          {/* Icon Badge */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#D8BB7A] bg-[#596522] text-white shadow-md">
            <LockClosedIcon className="h-7 w-7" />
          </div>

          <h1 className="mt-6 font-display text-3xl font-bold text-[#4D581E]">
            Customer Account
          </h1>
          <p className="mt-2 text-sm text-[#303515]/80">
            Sign in to view your orders, track shipments, and manage saved shipping addresses.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-left text-xs text-red-800">
              <p className="font-semibold">Authentication Notice:</p>
              <p className="mt-0.5">
                {error === "not_configured"
                  ? "Shopify Customer Account API credentials are not yet configured in environment variables."
                  : error === "state_mismatch"
                  ? "Security verification failed (state mismatch). Please try logging in again."
                  : searchParams.error_description || "An error occurred during authentication."}
              </p>
            </div>
          )}

          {/* Features / Benefits */}
          <div className="mt-8 space-y-3 text-left">
            <div className="flex items-center gap-3 rounded-2xl border border-[#D8BB7A]/30 bg-[#FAF9F4] p-3 text-xs text-[#303515]">
              <ShoppingBagIcon className="h-5 w-5 shrink-0 text-[#596522]" />
              <span>Instant access to past orders and tracking links</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[#D8BB7A]/30 bg-[#FAF9F4] p-3 text-xs text-[#303515]">
              <ShieldCheckIcon className="h-5 w-5 shrink-0 text-[#596522]" />
              <span>Passwordless secure verification powered by Shopify</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[#D8BB7A]/30 bg-[#FAF9F4] p-3 text-xs text-[#303515]">
              <SparklesIcon className="h-5 w-5 shrink-0 text-[#C49A45]" />
              <span>Faster checkout with saved addresses</span>
            </div>
          </div>

          {/* Login CTA */}
          <div className="mt-8">
            <Link
              href={`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
              prefetch={false}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#596522] py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-[#C49A45] hover:shadow-lg active:scale-98"
            >
              <LockClosedIcon className="h-4 w-4" />
              <span>Continue with Shopify Secure Login</span>
            </Link>
          </div>

          <p className="mt-6 text-center text-[11px] text-[#303515]/60">
            Protected by Shopify Customer Account OAuth 2.0 PKCE.
          </p>
        </div>
      </div>
    </div>
  );
}
