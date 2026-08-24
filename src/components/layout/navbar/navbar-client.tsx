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
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Link
          href={item.path}
          prefetch={true}
          onClick={() => setIsOpen(false)}
          className={`group relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
            isActive
              ? "bg-brand-gradient text-white shadow-[0_4px_14px_rgba(20,184,166,0.35)]"
              : "text-neutral-700 hover:bg-neutral-100/80 hover:text-brand dark:text-neutral-300 dark:hover:bg-neutral-800/80 dark:hover:text-white"
          }`}
        >
          {isActive ? (
            <motion.span
              layoutId="navActivePill"
              className="absolute inset-0 -z-10 rounded-full bg-brand-gradient"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          ) : null}

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
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute left-0 top-full z-[120] pt-2"
            >
              <div className="w-64 rounded-2xl border border-neutral-200/90 bg-white/95 p-3 shadow-2xl backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/95">
                <div className="mb-2 px-3 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500">
                  Categories
                </div>
                <div className="space-y-0.5">
                  {subCategories.map((cat) => {
                    const isCatActive = pathname === cat.href;
                    return (
                      <Link
                        key={cat.title}
                        href={cat.href}
                        prefetch={true}
                        onClick={() => setIsOpen(false)}
                        className={`group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                          isCatActive
                            ? "bg-brand-teal/10 text-brand-teal dark:bg-brand-teal/20 dark:text-brand-teal-light"
                            : "text-neutral-700 hover:bg-neutral-100 hover:text-brand dark:text-neutral-300 dark:hover:bg-neutral-800/80 dark:hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          {cat.image ? (
                            <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md border border-neutral-200/80 dark:border-neutral-700">
                              <Image
                                src={cat.image}
                                alt={cat.title}
                                fill
                                sizes="24px"
                                className="object-cover"
                              />
                            </span>
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-teal/40 transition-transform group-hover:scale-150 group-hover:bg-brand-teal" />
                          )}
                          <span>{cat.title}</span>
                        </span>
                        <ArrowRightIcon className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 text-brand-teal" />
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-2 border-t border-neutral-100 pt-2 dark:border-neutral-800">
                  <Link
                    href="/search"
                    prefetch={true}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wider text-brand-teal transition-all hover:bg-brand-teal/10 dark:text-brand-teal-light"
                  >
                    <span>Shop All Products</span>
                    <ArrowRightIcon className="h-3.5 w-3.5" />
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
  const bgAlpha = useTransform(scrollY, range, [0.78, 0.94]);
  const borderOpacity = useTransform(scrollY, range, [0.08, 0.35]);
  const shadowAlpha = useTransform(
    scrollY,
    range,
    theme === "dark" ? [0, 0.45] : [0, 0.08]
  );
  const logoScale = useTransform(scrollY, range, [1, 0.88]);

  const backdropFilter = useMotionTemplate`blur(${blur}px)`;
  const backgroundColor = useTransform(bgAlpha, (alpha) =>
    theme === "dark"
      ? `rgba(0, 0, 0, ${alpha})`
      : `rgba(250, 250, 249, ${alpha})`
  );
  const borderColor = useMotionTemplate`rgba(148, 163, 184, ${borderOpacity})`;
  const boxShadow = useTransform(shadowAlpha, (alpha) =>
    theme === "dark"
      ? `0 10px 40px rgba(0, 0, 0, ${alpha})`
      : `0 10px 40px rgba(15, 23, 42, ${alpha})`
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
        className="relative z-10 mx-auto flex h-full max-w-screen-2xl items-center gap-3 overflow-visible px-4 lg:gap-6 lg:px-6"
      >
        <div className="flex flex-none items-center gap-2 md:hidden">
          <MobileMenu menu={menu} collections={collections} />
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-8">
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
                <span className="rounded-full ring-0 transition-brand group-hover:ring-2 group-hover:ring-brand-teal/40 group-hover:ring-offset-2 group-hover:ring-offset-brand-cream dark:group-hover:ring-offset-black">
                  <LogoSquare />
                </span>
                <div className="hidden min-w-0 flex-col sm:flex">
                  <span className="font-display text-lg font-semibold leading-none tracking-tight text-brand transition-colors group-hover:text-brand-blue-dark dark:text-white dark:group-hover:text-brand-teal-light">
                    {siteName}
                  </span>
                  <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500 transition-colors group-hover:text-brand-teal">
                    Skincare
                  </span>
                </div>
              </Link>
            </motion.div>
          </motion.div>

          {menu.length > 0 ? (
            <ul className="hidden shrink-0 items-center gap-1 md:flex">
              {menu.map((item: Menu) => (
                <li key={item.title}>
                  <NavLink item={item} collections={collections} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="hidden min-w-0 flex-1 justify-center overflow-visible md:flex">
          <div className="relative z-50 w-full max-w-md overflow-visible">
            <Search />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <ThemeToggle />
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 20 }}
            className="rounded-full border border-neutral-200/80 bg-white/70 p-1 shadow-sm backdrop-blur-sm transition-brand hover:border-brand-teal/50 hover:shadow-[0_8px_24px_rgba(20,184,166,0.2)] dark:border-neutral-800 dark:bg-neutral-950/70 dark:hover:border-brand-teal/40"
          >
            <CartModal />
          </motion.div>
        </div>
      </motion.div>
    </motion.nav>
  );
}
