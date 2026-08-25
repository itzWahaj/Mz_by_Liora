"use client";

import LogoSquare from "@/components/logo-square";
import { Collection, Menu } from "@/lib/shopify/types";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
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
      <div
        className={`fixed inset-0 z-[1000] transition-[visibility] duration-300 ${
          isOpen ? "visible" : "invisible pointer-events-none delay-300"
        }`}
      >
        {/* Backdrop overlay */}
        <div
          aria-label="Close mobile menu overlay"
          role="button"
          tabIndex={-1}
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ease-out ${
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={closeMobileMenu}
        />

        {/* Mobile Drawer Panel */}
        <aside
          className={`relative flex h-full w-[85%] max-w-sm flex-col bg-[#FAF9F4] p-5 shadow-2xl dark:bg-neutral-950 z-[1001] transform-gpu border-r border-[#D8BB7A]/60 dark:border-neutral-800 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="mb-6 flex items-center justify-between border-b border-[#D8BB7A]/30 pb-4 dark:border-neutral-800">
            <Link
              href="/"
              prefetch={true}
              onClick={closeMobileMenu}
              className="flex items-center gap-2.5"
            >
              <LogoSquare size="sm" />
              <div className="flex flex-col">
                <span className="font-display text-lg font-semibold leading-none text-[#4D581E] dark:text-white">
                  MZ by LIORA
                </span>
                <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.2em] text-[#C49A45]">
                  Skincare
                </span>
              </div>
            </Link>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D8BB7A]/60 bg-[#FFFDF8] text-[#303515] shadow-sm transition-brand hover:border-[#C49A45] hover:bg-[#596522] hover:text-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
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
            <ul className="flex w-full flex-1 flex-col overflow-y-auto pr-1">
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
                  <li className="py-2.5" key={item.title}>
                    <Link
                      href={item.path}
                      prefetch={true}
                      onClick={closeMobileMenu}
                      className="group inline-flex items-center text-lg font-bold text-[#4D581E] transition-brand hover:text-[#596522] dark:text-white dark:hover:text-[#D8BB7A]"
                    >
                      <span className="relative">
                        {item.title}
                        <span className="absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 bg-[#596522] transition-transform duration-300 ease-out group-hover:scale-x-100" />
                      </span>
                    </Link>

                    {/* Sub-categories */}
                    {subCategories.length > 0 ? (
                      <ul className="mt-2.5 ml-3 space-y-2 border-l-2 border-[#D8BB7A]/40 pl-3">
                        {subCategories.map((sub) => (
                          <li key={sub.title}>
                            <Link
                              href={sub.path || "#"}
                              prefetch={true}
                              onClick={closeMobileMenu}
                              className="text-sm font-medium text-[#303515]/80 transition-colors hover:text-[#596522] dark:text-neutral-400 dark:hover:text-white"
                            >
                              {sub.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </aside>
      </div>,
      document.body
    );

  return (
    <>
      <button
        onClick={openMobileMenu}
        aria-label="Open mobile menu"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D8BB7A]/60 bg-[#FFFDF8]/90 text-[#303515] shadow-sm transition-transform duration-150 active:scale-95 md:hidden dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-white"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>
      {drawer}
    </>
  );
}
