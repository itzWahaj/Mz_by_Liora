import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer/auth";
import { getCustomerWishlist } from "@/lib/customer/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCustomerSession();

  if (!session?.accessToken) {
    return NextResponse.json({
      authenticated: false,
      wishlist: [],
    });
  }

  try {
    const wishlist = await getCustomerWishlist(session.accessToken);
    return NextResponse.json({
      authenticated: true,
      wishlist,
    });
  } catch (error) {
    console.error("Failed to fetch customer wishlist:", error);
    return NextResponse.json({
      authenticated: true,
      wishlist: [],
    });
  }
}
