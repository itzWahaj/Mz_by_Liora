"use server";

import { TAGS } from "@/lib/constants";
import {
  addToCart,
  createCart,
  getCart,
  removeFromCart,
  updateCart,
  shopifyFetch,
} from "@/lib/shopify";
import { applyDiscountCodeMutation } from "@/lib/shopify/mutations/cart";
import { ShopifyDiscountCodesUpdateOperation } from "@/lib/shopify/types";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function addItem(
  prevState: any,
  selectedVariantId: string | undefined
) {
  if (!selectedVariantId) {
    return "Error adding item to cart";
  }

  let cartId = cookies().get("cartId")?.value;

  try {
    if (!cartId) {
      const cart = await createCart();
      if (!cart?.id) {
        return "Error creating cart";
      }
      cartId = cart.id;
      cookies().set("cartId", cartId);
    }

    await addToCart(cartId, [
      { merchandiseId: selectedVariantId, quantity: 1 },
    ]);
    revalidateTag(TAGS.cart);
  } catch (error) {
    return "Error adding item to cart";
  }
}

export async function updateItemQuantity(
  prevState: any,
  payload: {
    merchandiseId: string;
    quantity: number;
  }
) {
  let cartId = cookies().get("cartId")?.value;
  if (!cartId) {
    return "Missing cart ID";
  }

  const { merchandiseId, quantity } = payload;

  try {
    const cart = await getCart(cartId);
    if (!cart) {
      return "Error fetching cart";
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId
    );

    if (lineItem && lineItem.id) {
      if (quantity === 0) {
        await removeFromCart(cartId, [lineItem.id]);
      } else {
        await updateCart(cartId, [
          {
            id: lineItem.id,
            merchandiseId,
            quantity,
          },
        ]);
      }
    } else if (quantity > 0) {
      // If the item doesn't exist in the cart and quantity > 0, add it
      await addToCart(cartId, [{ merchandiseId, quantity }]);
    }

    revalidateTag(TAGS.cart);
  } catch (error) {
    console.error(error);
    return "Error updating item quantity";
  }
}

export async function removeItem(prevState: any, merchandiseId: string) {
  let cartId = cookies().get("cartId")?.value;

  if (!cartId) {
    return "Missing cart ID";
  }

  try {
    const cart = await getCart(cartId);
    if (!cart) {
      return "Error fetching cart";
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId
    );

    if (lineItem && lineItem.id) {
      await removeFromCart(cartId, [lineItem.id]);
      revalidateTag(TAGS.cart);
    } else {
      return "Item not found in cart";
    }
  } catch (error) {
    return "Error removing item from cart";
  }
}

export async function redirectToCheckout(discountCode?: string) {
  let cartId = cookies().get("cartId")?.value;

  if (!cartId) {
    return "Missing cart ID";
  }

  let cart = await getCart(cartId);

  if (!cart) {
    return "Error fetching cart";
  }

  let checkoutUrl = cart.checkoutUrl;

  // Append discount code to the checkout URL if provided
  if (discountCode && discountCode.trim()) {
    const url = new URL(checkoutUrl);
    url.searchParams.set("discount", discountCode.trim().toUpperCase());
    checkoutUrl = url.toString();
  }

  redirect(checkoutUrl);
}

export async function createCartAndSetCookie() {
  const cart = await createCart();

  if (!cart?.id) {
    console.error(
      "Could not create a Shopify cart. Check SHOPIFY_STOREFRONT_ACCESS_TOKEN in .env.local."
    );
    return;
  }

  cookies().set("cartId", cart.id);
}

/**
 * Validates a discount code against the current cart using Shopify's
 * cartDiscountCodesUpdate mutation. Returns { valid: true } if applicable,
 * or { valid: false, message } if not.
 */
export async function validateDiscountCode(
  code: string
): Promise<{ valid: boolean; message?: string }> {
  const cartId = cookies().get("cartId")?.value;

  if (!cartId) {
    return { valid: false, message: "No active cart found." };
  }

  if (!code.trim()) {
    return { valid: false, message: "Please enter a promo code." };
  }

  try {
    const res = await shopifyFetch<ShopifyDiscountCodesUpdateOperation>({
      query: applyDiscountCodeMutation,
      variables: { cartId, discountCodes: [code.trim().toUpperCase()] },
      cache: "no-store",
    });

    const result = res.body.data?.cartDiscountCodesUpdate;

    // Check for API-level user errors
    if (result?.userErrors?.length) {
      return { valid: false, message: result.userErrors[0]?.message || "Invalid code." };
    }

    // Check if the code was recognised but not applicable
    const discountCode = result?.cart?.discountCodes?.[0];
    if (!discountCode || !discountCode.applicable) {
      return { valid: false, message: "This code is invalid or has expired." };
    }

    return { valid: true };
  } catch (err) {
    console.error("[validateDiscountCode]:", err);
    return { valid: false, message: "Could not validate code. Try again." };
  }
}
