"use client";

import CartModal from "@/components/cart/modal";
import LogoSquare from "@/components/logo-square";
import { useTheme } from "@/components/providers/theme-provider";
import { Collection, Menu } from "@/lib/shopify/types";
import { ArrowRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import MobileMenu from "./mobile-menu";
import Search from "./search";
import ThemeToggle from "./theme-toggle";
import AccountButton from "./account-button";

/** Scroll distance (px) over which the navbar fully settles. */
const SCROLL_START = 0;
const SCROLL_END = 140;

function NavLink({
  item,
  collections = [],
}: {
  item: Menu;
  collections?: Collection[];
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isShop =
    item.title.toLowerCase() === "shop" ||
    (item.items && item.items.length > 0);

  // Build category links: strictly use menu items configured in Shopify Admin
  const subCategories = useMemo(() => {
    if (!isShop) return [];

    const collectionMap = new Map(
      collections.map((col) => [col.title.toLowerCase(), col])
    );

    // If sub-items are defined in the Shopify menu link under Shop, use ONLY those
    if (item.items && item.items.length > 0) {
      return item.items
        .filter((child) => child.title && child.path)
        .map((child) => {
          const matchedCol = collectionMap.get(child.title.toLowerCase());
          return {
            title: child.title,
            href: child.path,
            image: matchedCol?.image?.url || null,
          };
        });
    }

    // Otherwise fallback to valid public collections
    return collections
      .filter((col) => !col.handle.startsWith("hidden"))
      .map((col) => ({
        title: col.title,
        href: col.path,
        image: col.image?.url || null,
      }));
  }, [collections, isShop, item.items]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const isActive =
    pathname === item.path ||
    (isShop &&
      subCategories.some((sub) => pathname === sub.href));

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Link
          href={item.path}
          prefetch={true}
          onClick={() => setIsOpen(false)}
          className={`group relative flex shrink-0 items-center gap-1.5 whitespace-nowrap overflow-hidden rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
            isActive
              ? "bg-[#596522] text-white shadow-[0_4px_14px_rgba(89,101,34,0.35)]"
              : "text-[#303515] hover:text-white dark:text-neutral-300 dark:hover:text-white"
          }`}
        >
          {!isActive && (
            <span
              aria-hidden
              className="absolute inset-0 origin-left scale-x-0 rounded-full bg-[#596522] opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100"
            />
          )}

          <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
            {item.title}
            {isShop ? (
              <ChevronDownIcon
                className={`h-3.5 w-3.5 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            ) : null}
          </span>
        </Link>
      </motion.div>

      {/* Categories Dropdown Panel */}
      {isShop && subCategories.length > 0 ? (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute left-0 top-full z-[9999] pt-2"
            >
              <div className="w-72 rounded-2xl border border-[#D8BB7A] bg-[#FFFDF8] p-3 shadow-[0_20px_50px_rgba(48,53,21,0.22)] dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-2 px-3 pt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C49A45]">
                  Categories
                </div>
                <div className="space-y-1">
                  {subCategories.map((cat) => {
                    const isCatActive = pathname === cat.href;
                    return (
                      <Link
                        key={cat.title}
                        href={cat.href}
                        prefetch={true}
                        onClick={() => setIsOpen(false)}
                        className={`group relative flex items-center justify-between overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                          isCatActive
                            ? "bg-[#596522] text-white shadow-sm font-semibold"
                            : "text-[#303515] hover:text-white dark:text-neutral-300 dark:hover:text-white"
                        }`}
                      >
                        {!isCatActive && (
                          <span
                            aria-hidden
                            className="absolute inset-0 origin-left scale-x-0 rounded-xl bg-[#596522] opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100"
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-2.5">
                          {cat.image ? (
                            <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-[#D8BB7A]/60 bg-white dark:border-neutral-700">
                              <Image
                                src={cat.image}
                                alt={cat.title}
                                fill
                                sizes="28px"
                                className="object-cover"
                              />
                            </span>
                          ) : (
                            <span className={`h-2 w-2 rounded-full transition-colors ${
                              isCatActive ? "bg-white" : "bg-[#D8BB7A] group-hover:bg-white"
                            }`} />
                          )}
                          <span>{cat.title}</span>
                        </span>
                        <ArrowRightIcon className="relative z-10 h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 text-white" />
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-2 border-t border-[#D8BB7A]/40 pt-2 dark:border-neutral-800">
                  <Link
                    href="/search"
                    prefetch={true}
                    onClick={() => setIsOpen(false)}
                    className="group relative flex items-center justify-between overflow-hidden rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#596522] transition-all hover:text-white dark:text-[#D8BB7A]"
                  >
                    <span
                      aria-hidden
                      className="absolute inset-0 origin-left scale-x-0 rounded-xl bg-[#596522] opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100"
                    />
                    <span className="relative z-10">Shop All Products</span>
                    <ArrowRightIcon className="relative z-10 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 text-[#596522] group-hover:text-white" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      ) : null}
    </div>
  );
}

export default function NavbarClient({
  menu,
  collections = [],
  siteName,
}: {
  menu: Menu[];
  collections?: Collection[];
  siteName: string;
}) {
  const { theme } = useTheme();
  const { scrollY } = useScroll();
  const range = [SCROLL_START, SCROLL_END];

  const height = useTransform(scrollY, range, [80, 56]);
  const paddingY = useTransform(scrollY, range, [14, 6]);
  const blur = useTransform(scrollY, range, [0, 18]);
  const bgAlpha = useTransform(scrollY, range, [0.82, 0.96]);
  const borderOpacity = useTransform(scrollY, range, [0.15, 0.45]);
  const shadowAlpha = useTransform(
    scrollY,
    range,
    theme === "dark" ? [0, 0.45] : [0, 0.06]
  );
  const logoScale = useTransform(scrollY, range, [1, 0.88]);

  const backdropFilter = useMotionTemplate`blur(${blur}px)`;
  const backgroundColor = useTransform(bgAlpha, (alpha) =>
    theme === "dark"
      ? `rgba(0, 0, 0, ${alpha})`
      : `rgba(250, 249, 244, ${alpha})`
  );
  const borderColor = useMotionTemplate`rgba(216, 187, 122, ${borderOpacity})`;
  const boxShadow = useTransform(shadowAlpha, (alpha) =>
    theme === "dark"
      ? `0 10px 40px rgba(0, 0, 0, ${alpha})`
      : `0 10px 40px rgba(48, 53, 21, ${alpha})`
  );

  return (
    <motion.nav
      style={{
        height,
        borderColor,
        backgroundColor,
        boxShadow,
        backdropFilter,
        // Safari
        WebkitBackdropFilter: backdropFilter,
      }}
      className="sticky top-0 z-[100] overflow-visible border-b will-change-[height,backdrop-filter]"
    >
      <motion.div
        style={{ paddingTop: paddingY, paddingBottom: paddingY }}
        className="relative z-10 mx-auto flex h-full max-w-screen-2xl items-center justify-between gap-2 overflow-visible px-3 sm:px-4 lg:gap-4 lg:px-6"
      >
        {/* Mobile Menu Trigger (< lg) */}
        <div className="flex flex-none items-center gap-2 lg:hidden">
          <MobileMenu menu={menu} collections={collections} />
        </div>

        {/* Left: Brand Logo & Desktop Navigation */}
        <div className="flex min-w-0 items-center gap-6 xl:gap-8">
          <motion.div style={{ scale: logoScale }} className="origin-left shrink-0">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
            >
              <Link
                href="/"
                prefetch={true}
                className="group flex items-center gap-2.5 rounded-full pr-1 transition-brand"
              >
                <span className="rounded-full ring-0 transition-brand group-hover:ring-2 group-hover:ring-[#D8BB7A] group-hover:ring-offset-2 group-hover:ring-offset-[#FAF9F4] dark:group-hover:ring-offset-black">
                  <LogoSquare />
                </span>
                <div className="hidden min-w-0 flex-col sm:flex">
                  <span className="font-display text-base lg:text-lg font-semibold leading-none tracking-tight text-[#4D581E] transition-colors group-hover:text-[#596522] dark:text-white dark:group-hover:text-[#D8BB7A]">
                    {siteName}
                  </span>
                  <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-[#C49A45] transition-colors group-hover:text-[#596522]">
                    Skincare
                  </span>
                </div>
              </Link>
            </motion.div>
          </motion.div>

          {/* Desktop Navigation Links (lg+) */}
          {menu.length > 0 ? (
            <ul className="hidden shrink-0 items-center gap-2 lg:flex xl:gap-3">
              {menu.map((item: Menu) => (
                <li key={item.title}>
                  <NavLink item={item} collections={collections} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* Right: Search Bar & Actions */}
        <div className="flex shrink-0 items-center justify-end gap-2 lg:gap-3">
          <div className="hidden sm:block relative z-50 w-36 md:w-44 lg:w-56 xl:w-72">
            <Search />
          </div>
          <ThemeToggle />
          <AccountButton />
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 20 }}
            className="rounded-full border border-[#D8BB7A]/60 bg-[#FFFDF8] p-1 shadow-sm backdrop-blur-sm transition-brand hover:border-[#C49A45] hover:shadow-[0_8px_24px_rgba(196,154,69,0.2)] dark:border-neutral-800 dark:bg-neutral-950/70"
          >
            <CartModal />
          </motion.div>
        </div>
      </motion.div>
    </motion.nav>
  );
}
