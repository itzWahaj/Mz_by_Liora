"use client";

import LogoSquare from "@/components/logo-square";
import { Collection, Menu } from "@/lib/shopify/types";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Search from "./search";

export default function MobileMenu({
  menu,
  collections = [],
}: {
  menu: Menu[];
  collections?: Collection[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const openMobileMenu = () => setIsOpen(true);
  const closeMobileMenu = () => setIsOpen(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileMenu();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const validCollections = collections.filter(
    (c) =>
      c.handle &&
      !c.handle.startsWith("hidden") &&
      c.title.toLowerCase() !== "all"
  );

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
            transition={{ duration: 0.24 }}
          >
            {/* Backdrop overlay */}
            <motion.button
              aria-label="Close mobile menu overlay"
              className="absolute inset-0 bg-black/60"
              onClick={closeMobileMenu}
            />

            {/* Mobile Drawer Panel */}
            <motion.div
              className="relative flex h-full w-[85%] max-w-sm flex-col bg-brand-surface p-5 shadow-2xl dark:bg-neutral-950 z-[1001] transform-gpu border-r border-neutral-200/80 dark:border-neutral-800"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Drawer Header */}
              <div className="mb-6 flex items-center justify-between border-b border-neutral-200/80 pb-4 dark:border-neutral-800">
                <Link
                  href="/"
                  prefetch={true}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5"
                >
                  <LogoSquare size="sm" />
                  <div className="flex flex-col">
                    <span className="font-display text-lg font-semibold leading-none text-brand dark:text-white">
                      MZ by LIORA
                    </span>
                    <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                      Skincare
                    </span>
                  </div>
                </Link>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300/90 bg-white text-black shadow-sm transition-brand hover:border-brand-teal dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  onClick={closeMobileMenu}
                  aria-label="Close mobile menu"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-6 w-full">
                <Search />
              </div>

              {/* Menu Links */}
              {menu.length > 0 ? (
                <motion.ul
                  className="flex w-full flex-1 flex-col overflow-y-auto pr-1"
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.06 } },
                  }}
                >
                  {menu.map((item: Menu) => {
                    const isShop = item.title.toLowerCase() === "shop";
                    const subCategories = isShop
                      ? item.items?.length
                        ? item.items
                        : validCollections.map((c) => ({
                            title: c.title,
                            path: c.path,
                          }))
                      : item.items || [];

                    return (
                      <motion.li
                        className="py-2.5"
                        key={item.title}
                        variants={{
                          hidden: { opacity: 0, x: -16 },
                          show: { opacity: 1, x: 0 },
                        }}
                      >
                        <Link
                          href={item.path}
                          prefetch={true}
                          onClick={closeMobileMenu}
                          className="group inline-flex items-center text-lg font-bold text-brand transition-brand hover:text-brand-teal dark:text-white dark:hover:text-brand-teal-light"
                        >
                          <span className="relative">
                            {item.title}
                            <span className="absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 bg-brand-gradient transition-transform duration-300 ease-out group-hover:scale-x-100" />
                          </span>
                        </Link>

                        {/* Sub-categories */}
                        {subCategories.length > 0 ? (
                          <ul className="mt-2.5 ml-3 space-y-2 border-l-2 border-brand-teal/20 pl-3">
                            {subCategories.map((sub) => (
                              <li key={sub.title}>
                                <Link
                                  href={sub.path || "#"}
                                  prefetch={true}
                                  onClick={closeMobileMenu}
                                  className="text-sm font-medium text-neutral-600 transition-colors hover:text-brand-teal dark:text-neutral-400 dark:hover:text-white"
                                >
                                  {sub.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </motion.li>
                    );
                  })}
                </motion.ul>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body
    );

  return (
    <>
      <motion.button
        onClick={openMobileMenu}
        aria-label="Open mobile menu"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300/90 bg-white/80 text-black shadow-sm transition-brand md:hidden dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-white"
      >
        <Bars3Icon className="h-5 w-5" />
      </motion.button>
      {drawer}
    </>
  );
}
