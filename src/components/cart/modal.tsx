"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createPortal } from "react-dom";
import { createUrl } from "@/lib/utils";
import { DEFAULT_OPTION } from "@/lib/constants";
import BrandDivider from "@/components/ui/brand-divider";
import GradientButton from "@/components/ui/gradient-button";
import LogoSquare from "@/components/logo-square";
import Price from "../price";
import LoadingDots from "../loading-dots";
import { createCartAndSetCookie, redirectToCheckout } from "./actions";
import { useCart } from "./cart-context";
import { trackMetaEvent } from "@/lib/meta/pixel";
import CloseCart from "./close-cart";
import { DeleteItemButton } from "./delete-item-button";
import { EditItemQuantityButton } from "./edit-item-quantity-button";
import OpenCart from "./open-cart";
import { TagIcon, TruckIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

type MerchandiseSearchParams = {
  [key: string]: string;
};

export default function CartModal() {
  const { cart, updateCartItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reduceMotion = Boolean(useReducedMotion());
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    createCartAndSetCookie();
  }, []);

  const currencyCode = cart?.cost?.totalAmount?.currencyCode || "PKR";

  // Calculate original subtotal & savings
  const originalSubtotal = (cart?.lines || []).reduce((acc, item) => {
    const unitPrice = Number(
      item.merchandise.price?.amount ||
      item.cost.amountPerQuantity?.amount ||
      Number(item.cost.totalAmount.amount) / Math.max(item.quantity, 1)
    );
    const unitComparePrice = Number(
      item.merchandise.compareAtPrice?.amount ||
      item.cost.compareAtAmountPerQuantity?.amount ||
      item.merchandise.product.compareAtPriceRange?.minVariantPrice?.amount ||
      0
    );
    const effectiveCompare = unitComparePrice > unitPrice ? unitComparePrice : unitPrice;
    return acc + effectiveCompare * item.quantity;
  }, 0);

  const currentTotal = Number(cart?.cost?.totalAmount?.amount || 0);
  const totalSavings = Math.max(0, originalSubtotal - currentTotal);
  const totalSavingsPercent =
    originalSubtotal > 0 ? Math.round((totalSavings / originalSubtotal) * 100) : 0;

  const drawer =
    mounted &&
    createPortal(
      <div
        className={`fixed inset-0 z-[1000] transition-[visibility] duration-300 ${
          isOpen ? "visible" : "invisible pointer-events-none delay-300"
        }`}
      >
        {/* Backdrop overlay */}
        <div
          aria-label="Close cart overlay"
          role="button"
          tabIndex={-1}
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ease-out ${
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={closeCart}
        />
        <aside
          className={`fixed bottom-0 right-0 top-0 z-[1001] flex h-dvh w-full max-w-[100vw] flex-col border-l border-[#D8BB7A]/60 bg-[#FAF9F4] p-4 text-[#303515] shadow-2xl sm:p-6 md:w-[410px] transform-gpu dark:border-neutral-700 dark:bg-neutral-950 dark:text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <LogoSquare size="sm" />
                    <div className="min-w-0">
                      <p className="font-display text-2xl font-semibold leading-none text-[#4D581E] dark:text-white">
                        My Cart
                      </p>
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#C49A45]">
                        MZ by LIORA
                      </p>
                    </div>
                  </div>
                  <button aria-label="Close cart" onClick={closeCart}>
                    <CloseCart />
                  </button>
                </div>
                <BrandDivider className="mt-4" />
              </div>

              {!cart || cart.lines.length === 0 ? (
                <div className="mt-16 rounded-2xl border border-[#D8BB7A]/60 bg-[#FFFDF8] p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="mx-auto flex justify-center">
                    <LogoSquare />
                  </div>
                  <p className="mt-4 text-center font-display text-2xl font-bold text-[#4D581E] dark:text-white">
                    Your Cart is Empty.
                  </p>
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col pt-2">
                  {/* Free Delivery Nationwide Highlight Bar */}
                  <div className="mx-2 mb-2 flex items-center justify-between gap-3 rounded-2xl border border-[#D8BB7A]/60 bg-[#FAF9F4] p-3 text-xs shadow-xs dark:border-neutral-800 dark:bg-neutral-900/80">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#596522] text-white shadow-xs">
                        <TruckIcon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-bold text-[#4D581E] dark:text-[#D8BB7A]">
                          Free Shipping Unlocked!
                        </p>
                        <p className="text-[11px] text-[#303515]/75 dark:text-neutral-400">
                          No separate delivery charges across Pakistan.
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#596522] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                      FREE
                    </span>
                  </div>

                  <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2 pr-1">
                    <AnimatePresence initial={false}>
                      {cart.lines
                        .sort((a, b) =>
                          a.merchandise.product.title.localeCompare(
                            b.merchandise.product.title
                          )
                        )
                        .map((item) => {
                          const merchandiseSearchParams =
                            {} as MerchandiseSearchParams;

                          item.merchandise.selectedOptions.forEach(
                            ({ name, value }) => {
                              if (value !== DEFAULT_OPTION) {
                                merchandiseSearchParams[
                                  name.toLocaleLowerCase()
                                ] = value;
                              }
                            }
                          );

                          const merchandiseUrl = createUrl(
                            `/product/${item.merchandise.product.handle}`,
                            new URLSearchParams(merchandiseSearchParams)
                          );
                          const image =
                            item.merchandise.product.featuredImage?.url
                              ? item.merchandise.product.featuredImage
                              : null;

                          const unitPrice = Number(
                            item.merchandise.price?.amount ||
                            item.cost.amountPerQuantity?.amount ||
                            Number(item.cost.totalAmount.amount) / Math.max(item.quantity, 1)
                          );

                          const unitComparePrice = Number(
                            item.merchandise.compareAtPrice?.amount ||
                            item.cost.compareAtAmountPerQuantity?.amount ||
                            item.merchandise.product.compareAtPriceRange?.minVariantPrice?.amount ||
                            0
                          );

                          const hasLineDiscount = unitComparePrice > unitPrice;
                          const lineCompareTotal = hasLineDiscount
                            ? unitComparePrice * item.quantity
                            : Number(item.cost.totalAmount.amount);
                          const lineDiscountPercent = hasLineDiscount
                            ? Math.round(((unitComparePrice - unitPrice) / unitComparePrice) * 100)
                            : 0;

                          return (
                            <motion.li
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.18 }}
                              key={item.merchandise.id}
                              className="flex w-full flex-col border-b border-[#D8BB7A]/30 px-2 py-4 dark:border-neutral-800"
                            >
                              <div className="relative flex w-full flex-row items-start justify-between gap-3">
                                <div className="z-30 flex flex-1 flex-row space-x-3.5">
                                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[#D8BB7A]/50 bg-[#FFFDF8] shadow-[0_8px_24px_rgba(48,53,21,0.06)] transition-brand hover:border-[#C49A45] dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-none">
                                    <div className="absolute -left-2 -top-2 z-40">
                                      <DeleteItemButton
                                        item={item}
                                        optimisticUpdate={updateCartItem}
                                      />
                                    </div>
                                    <Link
                                      href={merchandiseUrl}
                                      onClick={closeCart}
                                      className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl"
                                    >
                                      {image?.url ? (
                                        <Image
                                          className="h-full w-full object-cover"
                                          width={64}
                                          height={64}
                                          alt={
                                            image.altText ||
                                            item.merchandise.product.title
                                          }
                                          src={image.url}
                                        />
                                      ) : (
                                        <Image
                                          src="/logo.png"
                                          alt="MZ by LIORA"
                                          width={40}
                                          height={40}
                                          className="h-10 w-10 object-contain opacity-80"
                                        />
                                      )}
                                    </Link>
                                  </div>
                                  <Link
                                    href={merchandiseUrl}
                                    onClick={closeCart}
                                    className="flex min-w-0 flex-1 flex-col pr-1"
                                  >
                                    <span className="line-clamp-2 text-sm font-semibold leading-snug text-[#303515] transition-colors hover:text-[#596522] dark:text-white dark:hover:text-[#D8BB7A]">
                                      {item.merchandise.product.title}
                                    </span>
                                    {item.merchandise.title !== DEFAULT_OPTION ? (
                                      <p className="mt-0.5 text-xs text-[#303515]/60 dark:text-neutral-400">
                                        {item.merchandise.title}
                                      </p>
                                    ) : null}

                                    {/* Line item discount badge if on sale */}
                                    {hasLineDiscount && (
                                      <div className="mt-1 flex items-center gap-1">
                                        <span className="rounded bg-[#596522]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#596522] dark:bg-[#C49A45]/20 dark:text-[#D8BB7A]">
                                          {lineDiscountPercent}% OFF
                                        </span>
                                      </div>
                                    )}
                                  </Link>
                                </div>

                                <div className="z-30 flex flex-col items-end gap-1">
                                  <div className="flex flex-col items-end">
                                    <Price
                                      className="text-right text-sm font-semibold text-[#4D581E] dark:text-white"
                                      amount={item.cost.totalAmount.amount}
                                      currencyCode={currencyCode}
                                    />
                                    {hasLineDiscount && (
                                      <span className="text-right text-xs text-neutral-400 line-through">
                                        <Price amount={String(lineCompareTotal)} currencyCode={currencyCode} />
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-2 flex h-8 items-center rounded-full border border-[#D8BB7A]/60 bg-[#FFFDF8] dark:border-neutral-700 dark:bg-neutral-900">
                                    <EditItemQuantityButton
                                      item={item}
                                      type="minus"
                                      optimisticUpdate={updateCartItem}
                                    />
                                    <p className="w-6 text-center text-xs font-semibold">
                                      <span className="w-full text-sm">
                                        {item.quantity}
                                      </span>
                                    </p>
                                    <EditItemQuantityButton
                                      item={item}
                                      type="plus"
                                      optimisticUpdate={updateCartItem}
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.li>
                          );
                        })}
                    </AnimatePresence>
                  </ul>

                  {/* Pricing Breakdown & Checkout */}
                  <div className="shrink-0 border-t border-[#D8BB7A]/40 bg-[#FFFDF8]/90 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900/40">
                    {/* Subtotal */}
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[#303515]/75 dark:text-neutral-400">Subtotal</p>
                      <Price
                        className="text-right font-semibold text-[#303515] dark:text-white"
                        amount={String(originalSubtotal > 0 ? originalSubtotal : cart.cost.subtotalAmount.amount)}
                        currencyCode={currencyCode}
                      />
                    </div>

                    {/* Total Savings / Discount */}
                    {totalSavings > 0 && (
                      <div className="mb-2 flex items-center justify-between text-[#596522] dark:text-[#D8BB7A]">
                        <div className="flex items-center gap-1.5">
                          <TagIcon className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-medium">Total Savings</span>
                          {totalSavingsPercent > 0 && (
                            <span className="rounded-full bg-[#596522]/15 px-2 py-0.5 text-[10px] font-bold text-[#596522] dark:bg-[#C49A45]/20 dark:text-[#D8BB7A]">
                              {totalSavingsPercent}% OFF
                            </span>
                          )}
                        </div>
                        <span className="font-semibold">
                          - <Price amount={String(totalSavings)} currencyCode={currencyCode} />
                        </span>
                      </div>
                    )}

                    {/* Shipping */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-[#303515]/80 dark:text-neutral-300">
                        <TruckIcon className="h-4 w-4 text-[#596522] dark:text-[#D8BB7A]" />
                        <span className="font-medium">Shipping & Delivery</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#596522] dark:text-[#D8BB7A]">
                          FREE
                        </span>
                        <span className="block text-[10px] text-[#303515]/60 dark:text-neutral-400">
                          No delivery charges
                        </span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="mb-4 flex items-center justify-between border-t border-[#D8BB7A]/40 pt-3 dark:border-neutral-800">
                      <div>
                        <p className="text-base font-bold text-[#4D581E] dark:text-white">
                          Total
                        </p>
                        <p className="text-[11px] text-[#303515]/60 dark:text-neutral-400">
                          Inclusive of all applicable taxes
                        </p>
                      </div>
                      <Price
                        className="text-right text-xl font-bold text-[#4D581E] dark:text-white"
                        amount={cart.cost.totalAmount.amount}
                        currencyCode={currencyCode}
                      />
                    </div>

                    {/* Checkout CTA */}
                    <form
                      action={async () => {
                        if (cart) {
                          const totalVal = parseFloat(
                            cart.cost.totalAmount.amount || "0"
                          );
                          const currency =
                            cart.cost.totalAmount.currencyCode || "PKR";
                          const contentIds = cart.lines
                            .map(
                              (line) =>
                                line.merchandise.product?.id ||
                                line.merchandise.id
                            )
                            .filter(Boolean);
                          const contents = cart.lines.map((line) => ({
                            id: line.merchandise.id,
                            quantity: line.quantity,
                            item_price:
                              parseFloat(
                                line.cost.totalAmount.amount || "0"
                              ) / (line.quantity || 1),
                            title: line.merchandise.product.title,
                          }));

                          trackMetaEvent("InitiateCheckout", {
                            customData: {
                              value: totalVal,
                              currency,
                              num_items: cart.totalQuantity,
                              content_ids: contentIds,
                              contents,
                              content_type: "product",
                            },
                          });
                        }
                        await redirectToCheckout();
                      }}
                      className="shrink-0"
                    >
                      <CheckoutButton />
                    </form>
                  </div>
                </div>
              )}
        </aside>
      </div>,
      document.body
    );

  return (
    <>
      <button
        aria-label="Open cart"
        data-cart-button
        onClick={openCart}
        className="rounded-full outline-none transition-transform duration-300 ease-out"
      >
        <OpenCart quantity={cart?.totalQuantity} />
      </button>
      {drawer}
    </>
  );
}

function CheckoutButton() {
  const { pending } = useFormStatus();

  return (
    <GradientButton
      type="submit"
      fullWidth
      className="h-12 w-full text-base font-semibold"
      disabled={pending}
    >
      {pending ? <LoadingDots className="bg-white" /> : "Proceed to Checkout"}
    </GradientButton>
  );
}
