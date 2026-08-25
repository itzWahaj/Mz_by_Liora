import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer/auth";
import { getCustomerOrders, getCustomerProfile } from "@/lib/customer/client";
import AccountClient from "@/components/account/account-client";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Account | MZ by LIORA",
  description: "Manage your MZ by LIORA customer profile, order history, and saved addresses.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccountPage() {
  const session = await getCustomerSession();

  if (!session?.accessToken) {
    redirect("/api/auth/login?returnTo=/account");
  }

  const [profile, orders] = await Promise.all([
    getCustomerProfile(session.accessToken),
    getCustomerOrders(session.accessToken),
  ]);

  if (!profile) {
    // If token was rejected by Shopify Customer Account API, redirect to login
    redirect("/api/auth/login?returnTo=/account");
  }

  return <AccountClient profile={profile} orders={orders} />;
}
