import { redirect } from "next/navigation";
import { decodeIdToken, getCustomerSession } from "@/lib/customer/auth";
import {
  getCustomerOrders,
  getCustomerProfile,
  getCustomerWishlist,
} from "@/lib/customer/client";
import AccountClient from "@/components/account/account-client";
import { CustomerProfile } from "@/lib/customer/types";
import { getProducts } from "@/lib/shopify";
import { Product } from "@/lib/shopify/types";
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
    redirect("/account/login?returnTo=/account");
  }

  // Fetch GraphQL profile, order history, and wishlist concurrently
  const [profileResult, ordersResult, wishlistResult, allProductsResult] =
    await Promise.allSettled([
      getCustomerProfile(session.accessToken),
      getCustomerOrders(session.accessToken),
      getCustomerWishlist(session.accessToken),
      getProducts({}),
    ]);

  const profileFromGql =
    profileResult.status === "fulfilled" ? profileResult.value : null;
  const orders = ordersResult.status === "fulfilled" ? ordersResult.value : [];
  const wishlistIds =
    wishlistResult.status === "fulfilled" ? wishlistResult.value : [];
  const allProducts =
    allProductsResult.status === "fulfilled" ? allProductsResult.value : [];

  // Match wishlist IDs against products catalog
  const wishlistProducts: Product[] = allProducts.filter((p) =>
    wishlistIds.some(
      (id) =>
        id === p.id ||
        id.endsWith(p.id) ||
        p.id.endsWith(id)
    )
  );

  // If GraphQL profile fetch returned null, decode the ID token
  const idPayload = session.idToken ? decodeIdToken(session.idToken) : null;

  const profile: CustomerProfile = profileFromGql || {
    id: idPayload?.id || "customer",
    firstName: idPayload?.firstName || "",
    lastName: idPayload?.lastName || "",
    displayName: idPayload?.displayName || "Valued Customer",
    emailAddress: idPayload?.email ? { emailAddress: idPayload.email } : undefined,
  };

  return (
    <AccountClient
      profile={profile}
      orders={orders}
      wishlistProducts={wishlistProducts}
    />
  );
}
