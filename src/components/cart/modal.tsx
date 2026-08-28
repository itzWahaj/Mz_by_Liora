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
import { createCartAndSetCookie, redirectToCheckout, validateDiscountCode } from "./actions";
import { useCart } from "./cart-context";
import { trackMetaEvent } from "@/lib/meta/pixel";
import CloseCart from "./close-cart";
import { DeleteItemButton } from "./delete-item-button";
import { EditItemQuantityButton } from "./edit-item-quantity-button";
import OpenCart from "./open-cart";
import { TagIcon, TruckIcon, CheckCircleIcon, XMarkIcon, TicketIcon } from "@heroicons/react/24/outline";

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

  // Coupon code state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  async function handleApplyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCouponLoading(true);
    setCouponError("");
    const result = await validateDiscountCode(code);
    setCouponLoading(false);
    if (result.valid) {
      setAppliedCoupon(code.toUpperCase());
      setCouponOpen(false);
    } else {
      setCouponError(result.message || "Invalid promo code.");
    }
  }

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

  // Free shipping threshold (Rs 500)
  const FREE_SHIPPING_THRESHOLD = 500;
  const cartTotal = Number(cart?.cost?.totalAmount?.amount || 0);
  const shippingEligible = cartTotal >= FREE_SHIPPING_THRESHOLD;
  const amountLeft = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal);
  const shippingProgress = Math.min(100, Math.round((cartTotal / FREE_SHIPPING_THRESHOLD) * 100));

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
                  {/* Free Shipping Progress Bar */}
                  <div className="mx-2 mb-1.5 overflow-hidden rounded-xl border border-[#D8BB7A]/60 bg-[#FAF9F4] px-3 py-2 text-xs shadow-xs dark:border-neutral-800 dark:bg-neutral-900/80">
                    {shippingEligible ? (
                      /* Unlocked state */
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#596522] text-white shadow-xs">
                            <TruckIcon className="h-3.5 w-3.5" />
                          </span>
                          <div>
                            <p className="font-bold text-[#4D581E] dark:text-[#D8BB7A]">Free Shipping Unlocked! 🎉</p>
                            <p className="text-[10px] text-[#303515]/65 dark:text-neutral-400">No delivery charges across Pakistan.</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-[#596522] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-xs">
                          FREE
                        </span>
                      </div>
                    ) : (
                      /* Progress state */
                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <TruckIcon className="h-3.5 w-3.5 text-[#596522] dark:text-[#D8BB7A]" />
                            <span className="font-medium text-[#303515] dark:text-neutral-200">
                              Add{" "}
                              <span className="font-bold text-[#596522] dark:text-[#D8BB7A]">
                                Rs {amountLeft.toLocaleString()}
                              </span>{" "}
                              more for free shipping
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-[#303515]/60 dark:text-neutral-400">
                            {shippingProgress}%
                          </span>
                        </div>
                        {/* Progress track */}
                        <div className="relative h-1.5 overflow-hidden rounded-full bg-[#D8BB7A]/30 dark:bg-neutral-700">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#596522] to-[#C49A45] transition-all duration-500 ease-out"
                            style={{ width: `${shippingProgress}%` }}
                          />
                          {/* Glowing tip */}
                          {shippingProgress > 5 && (
                            <div
                              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#C49A45] shadow-[0_0_6px_rgba(196,154,69,0.8)] ring-2 ring-white dark:ring-neutral-900 transition-all duration-500"
                              style={{ left: `calc(${shippingProgress}% - 6px)` }}
                            />
                          )}
                        </div>
                        <p className="mt-1 text-[10px] text-[#303515]/50 dark:text-neutral-500">
                          Free shipping on orders over Rs {FREE_SHIPPING_THRESHOLD.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1 pr-1">
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
                  <div className="shrink-0 border-t border-[#D8BB7A]/40 bg-[#FFFDF8]/90 px-3 py-2.5 text-sm dark:border-neutral-800 dark:bg-neutral-900/40">
                    {/* Compact summary row */}
                    <div className="flex flex-col gap-0.5">

                      {/* Subtotal */}
                      <div className="flex items-center justify-between py-0.5">
                        <p className="text-xs text-[#303515]/65 dark:text-neutral-400">Subtotal</p>
                        <Price
                          className="text-right text-xs font-semibold text-[#303515] dark:text-white"
                          amount={String(originalSubtotal > 0 ? originalSubtotal : cart.cost.subtotalAmount.amount)}
                          currencyCode={currencyCode}
                        />
                      </div>

                      {/* Total Savings / Discount */}
                      {totalSavings > 0 && (
                        <div className="flex items-center justify-between py-0.5 text-[#596522] dark:text-[#D8BB7A]">
                          <div className="flex items-center gap-1">
                            <TagIcon className="h-3 w-3 shrink-0" />
                            <span className="text-xs font-medium">Savings</span>
                            {totalSavingsPercent > 0 && (
                              <span className="rounded-full bg-[#596522]/15 px-1.5 py-0 text-[9px] font-bold text-[#596522] dark:bg-[#C49A45]/20 dark:text-[#D8BB7A]">
                                {totalSavingsPercent}% OFF
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-semibold">
                            - <Price amount={String(totalSavings)} currencyCode={currencyCode} />
                          </span>
                        </div>
                      )}

                      {/* Shipping — compact inline */}
                      {/* Shipping row — reflects actual eligibility */}
                      <div className="flex items-center justify-between py-0.5">
                        <div className="flex items-center gap-1 text-xs text-[#303515]/65 dark:text-neutral-400">
                          <TruckIcon className="h-3 w-3 text-[#596522] dark:text-[#D8BB7A]" />
                          <span>Shipping</span>
                        </div>
                        {shippingEligible ? (
                          <span className="text-xs font-bold text-[#596522] dark:text-[#D8BB7A]">FREE</span>
                        ) : (
                          <span className="text-xs text-[#303515]/65 dark:text-neutral-400">Calculated at checkout</span>
                        )}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="mt-2 flex items-center justify-between border-t border-[#D8BB7A]/40 pt-2 dark:border-neutral-800">
                      <div>
                        <p className="text-sm font-bold text-[#4D581E] dark:text-white">Total</p>
                        <p className="text-[10px] text-[#303515]/55 dark:text-neutral-400">Inclusive of all taxes</p>
                      </div>
                      <Price
                        className="text-right text-lg font-bold text-[#4D581E] dark:text-white"
                        amount={cart.cost.totalAmount.amount}
                        currencyCode={currencyCode}
                      />
                    </div>

                    {/* Checkout CTA */}
                    {/* Coupon / Promo Code */}
                    <div className="mb-2">
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between rounded-lg border border-[#596522]/40 bg-[#596522]/8 px-2.5 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <TicketIcon className="h-3.5 w-3.5 text-[#596522] dark:text-[#D8BB7A]" />
                            <span className="text-xs font-semibold text-[#596522] dark:text-[#D8BB7A]">
                              {appliedCoupon}
                            </span>
                            <span className="text-[10px] text-[#596522]/70 dark:text-[#D8BB7A]/70">applied at checkout</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setAppliedCoupon(""); setCouponInput(""); setCouponOpen(false); }}
                            className="ml-1 rounded-full p-0.5 text-[#596522]/70 hover:bg-[#596522]/15 hover:text-[#596522] dark:text-[#D8BB7A]/60"
                            aria-label="Remove coupon"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ) : couponOpen ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && couponInput.trim() && !couponLoading) {
                                handleApplyCoupon();
                              }
                            }}
                            placeholder="Enter promo code"
                            className="h-8 flex-1 rounded-lg border border-[#D8BB7A]/60 bg-white px-2.5 text-xs font-medium uppercase tracking-wider text-[#303515] placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-400 focus:border-[#596522] focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                            autoFocus
                          />
                          <button
                            type="button"
                            disabled={!couponInput.trim() || couponLoading}
                            onClick={handleApplyCoupon}
                            className="h-8 rounded-lg bg-[#596522] px-3 text-xs font-semibold text-white disabled:opacity-40 hover:bg-[#C49A45] transition-colors flex items-center gap-1.5"
                          >
                            {couponLoading ? (
                              <>
                                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                <span>Checking…</span>
                              </>
                            ) : "Apply"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setCouponOpen(false); setCouponInput(""); setCouponError(""); }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-400 hover:border-neutral-300 dark:border-neutral-700"
                            aria-label="Cancel"
                          >
                            <XMarkIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCouponOpen(true)}
                          className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-[#D8BB7A]/70 px-2.5 py-1.5 text-xs font-medium text-[#596522] transition-colors hover:border-[#596522] hover:bg-[#596522]/5 dark:border-neutral-700 dark:text-[#D8BB7A] dark:hover:border-[#D8BB7A]/60"
                        >
                          <TicketIcon className="h-3.5 w-3.5" />
                          <span>Have a promo code?</span>
                        </button>
                      )}
                      {couponError && (
                        <p className="mt-1 text-[10px] text-red-500">{couponError}</p>
                      )}
                    </div>

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
                        await redirectToCheckout(appliedCoupon || undefined);
                      }}
                      className="mt-2.5 shrink-0"
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
