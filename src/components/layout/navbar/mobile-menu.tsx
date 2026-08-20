"use client";

import { Collection, Menu } from "@/lib/shopify/types";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import Search from "./search";

export default function MobileMenu({
  menu,
  collections = [],
}: {
  menu: Menu[];
  collections?: Collection[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const openMobileMenu = () => setIsOpen(true);
  const closeMobileMenu = () => setIsOpen(false);

  const validCollections = collections.filter(
    (c) => c.handle && !c.handle.startsWith("hidden") && c.title.toLowerCase() !== "all"
  );

  return (
    <>
      <motion.button
        onClick={openMobileMenu}
        aria-label="Open mobile menu"
        whileTap={{ scale: 0.95 }}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300/90 bg-white/80 text-black shadow-sm transition-brand md:hidden dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-white"
      >
        <Bars3Icon className="h-4" />
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
          >
            <motion.button
              aria-label="Close mobile menu overlay"
              className="absolute inset-0 bg-black/35 backdrop-blur-sm"
              onClick={closeMobileMenu}
            />
            <motion.div
              className="relative flex h-full w-[85%] max-w-sm flex-col bg-brand-cream p-5 dark:bg-neutral-950"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
            >
              <button
                className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300/90 bg-white text-black shadow-sm transition-brand dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                onClick={closeMobileMenu}
                aria-label="Close mobile menu"
              >
                <XMarkIcon className="h-6" />
              </button>
              <div className="mb-6 w-full">
                <Search />
              </div>
              {menu.length > 0 ? (
                <motion.ul
                  className="flex w-full flex-col overflow-y-auto"
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.08 } },
                  }}
                >
                  {menu.map((item: Menu) => {
                    const isShop = item.title.toLowerCase() === "shop";
                    const subCategories = isShop
                      ? item.items?.length
                        ? item.items
                        : validCollections.map((c) => ({ title: c.title, path: c.path }))
                      : item.items || [];

                    return (
                      <motion.li
                        className="py-2"
                        key={item.title}
                        variants={{
                          hidden: { opacity: 0, x: -20 },
                          show: { opacity: 1, x: 0 },
                        }}
                      >
                        <Link
                          href={item.path}
                          prefetch={true}
                          onClick={closeMobileMenu}
                          className="group inline-flex text-xl font-bold text-brand transition-brand hover:text-brand-blue-dark dark:text-white"
                        >
                          <span className="relative">
                            {item.title}
                            <span className="absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 bg-brand-gradient transition-transform duration-300 ease-out group-hover:scale-x-100" />
                          </span>
                        </Link>

                        {/* Sub-categories in Mobile Drawer */}
                        {subCategories.length > 0 ? (
                          <ul className="mt-2 ml-4 space-y-2 border-l-2 border-brand-teal/20 pl-3">
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
      </AnimatePresence>
    </>
  );
}
