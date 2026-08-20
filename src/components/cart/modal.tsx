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
import CloseCart from "./close-cart";
import { DeleteItemButton } from "./delete-item-button";
import { EditItemQuantityButton } from "./edit-item-quantity-button";
import OpenCart from "./open-cart";

type MerchandiseSearchParams = {
  [key: string]: string;
};

export default function CartModal() {
  const { cart, updateCartItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const quantityRef = useRef(cart?.totalQuantity);
  const reduceMotion = Boolean(useReducedMotion());
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!cart) {
      createCartAndSetCookie();
    }
  }, [cart]);

  useEffect(() => {
    // Keep quantity ref in sync without auto-opening the drawer on add.
    quantityRef.current = cart?.totalQuantity;
  }, [cart?.totalQuantity]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const drawer =
    mounted &&
    createPortal(
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-[1000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          >
            <motion.button
              aria-label="Close cart overlay"
              className="absolute inset-0 bg-black/50 backdrop-blur-md"
              onClick={closeCart}
            />
            <motion.aside
              data-lenis-prevent
              className="fixed bottom-0 right-0 top-0 z-[1001] flex h-dvh w-full max-w-[100vw] flex-col border-l border-neutral-200 bg-white p-4 text-black shadow-2xl sm:p-6 md:w-[390px] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", damping: 25, stiffness: 300 }
              }
            >
              <div className="shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <LogoSquare size="sm" />
                    <div className="min-w-0">
                      <p className="font-display text-2xl font-semibold leading-none">
                        My Cart
                      </p>
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
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
                <div className="mt-16 rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="mx-auto flex justify-center">
                    <LogoSquare />
                  </div>
                  <p className="mt-4 text-center font-display text-2xl font-bold">
                    Your Cart is Empty.
                  </p>
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col pt-4">
                  <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2">
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

                          return (
                            <motion.li
                              layout
                              initial={{ opacity: 0, y: 18 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -12 }}
                              transition={{ duration: 0.2 }}
                              key={item.merchandise.id}
                              className="flex w-full flex-col border-b border-neutral-200 dark:border-neutral-800"
                            >
                              <div className="relative flex w-full flex-row justify-between px-1 py-4">
                                <div className="absolute z-40 -ml-1 -mt-2">
                                  <DeleteItemButton
                                    item={item}
                                    optimisticUpdate={updateCartItem}
                                  />
                                </div>
                                <Link
                                  href={merchandiseUrl}
                                  onClick={closeCart}
                                  className="z-30 flex flex-row space-x-4"
                                >
                                  <div className="relative flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-brand hover:border-brand-teal dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-none">
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
                                  </div>
                                  <div className="flex flex-1 flex-col text-base">
                                    <span className="leading-tight">
                                      {item.merchandise.product.title}
                                    </span>
                                    {item.merchandise.title !==
                                    DEFAULT_OPTION ? (
                                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        {item.merchandise.title}
                                      </p>
                                    ) : null}
                                  </div>
                                </Link>
                                <div className="flex h-16 flex-col justify-between">
                                  <Price
                                    className="flex justify-end space-y-2 text-right text-sm"
                                    amount={item.cost.totalAmount.amount}
                                    currencyCode={
                                      item.cost.totalAmount.currencyCode
                                    }
                                  />
                                  <div className="ml-auto flex h-9 flex-row items-center rounded-full border border-brand-teal/35 bg-white shadow-sm transition-brand hover:border-brand-teal dark:border-brand-teal/40 dark:bg-neutral-900">
                                    <EditItemQuantityButton
                                      item={item}
                                      type="minus"
                                      optimisticUpdate={updateCartItem}
                                    />
                                    <p className="w-6 text-center">
                                      <span className="w-full text-sm font-medium">
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
                  <div className="shrink-0 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-1 dark:border-neutral-800">
                      <p>Taxes</p>
                      <Price
                        className="text-right text-base text-black dark:text-white"
                        amount={cart.cost.totalTaxAmount.amount}
                        currencyCode={cart.cost.totalTaxAmount.currencyCode}
                      />
                    </div>
                    <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-1 pt-1 dark:border-neutral-800">
                      <p>Shipping</p>
                      <p className="text-right">Calculated at checkout</p>
                    </div>
                    <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-2 pt-2 dark:border-neutral-800">
                      <p className="text-base font-semibold text-black dark:text-white">
                        Total
                      </p>
                      <Price
                        className="text-right text-lg font-semibold text-black dark:text-white"
                        amount={cart.cost.totalAmount.amount}
                        currencyCode={cart.cost.totalAmount.currencyCode}
                      />
                    </div>
                  </div>
                  <form action={redirectToCheckout} className="shrink-0">
                    <CheckoutButton />
                  </form>
                </div>
              )}
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>,
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
      disabled={pending}
      fullWidth
      className="h-11 px-6"
    >
      {pending ? <LoadingDots className="bg-white" /> : "Proceed to Checkout"}
    </GradientButton>
  );
}
