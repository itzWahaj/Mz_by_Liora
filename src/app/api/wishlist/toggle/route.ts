import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer/auth";
import { toggleCustomerWishlistItem } from "@/lib/customer/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getCustomerSession();

  if (!session?.accessToken) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message: "Please log in to save items to your wishlist.",
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const productId = body.productId?.trim();

    if (!productId) {
      return NextResponse.json(
        { error: "bad_request", message: "Missing productId in request body." },
        { status: 400 }
      );
    }

    const result = await toggleCustomerWishlistItem(
      productId,
      session.accessToken
    );

    return NextResponse.json({
      success: true,
      inWishlist: result.inWishlist,
      wishlist: result.wishlist,
    });
  } catch (error) {
    console.error("Failed to toggle wishlist item:", error);
    return NextResponse.json(
      {
        error: "server_error",
        message: "Failed to update wishlist. Please try again.",
      },
      { status: 500 }
    );
  }
}
