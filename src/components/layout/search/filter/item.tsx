"use client";

import type { SortFilterItem as SortFilterItemType } from "@/lib/constants";
import { createUrl } from "@/lib/utils";
import clsx from "clsx";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ListItem, type PathFilterItem as PathItem } from ".";

function formatLabel(title: string) {
  if (title.includes(" ") || title !== title.toLowerCase()) return title;
  return title
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function PathFilterItem({ item }: { item: PathItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = pathname === item.path;
  const newParams = new URLSearchParams(searchParams.toString());
  const DynamicTag = active ? "p" : Link;

  newParams.delete("q");

  return (
    <li key={item.title}>
      <DynamicTag
        href={createUrl(item.path, newParams)}
        className={clsx(
          "group relative flex w-full items-center overflow-hidden rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300",
          active
            ? "bg-[#596522] font-semibold text-white shadow-[0_4px_14px_rgba(89,101,34,0.35)]"
            : "text-[#303515] hover:text-white dark:text-neutral-300 dark:hover:text-white"
        )}
      >
        {!active && (
          <span
            aria-hidden
            className="absolute inset-0 origin-left scale-x-0 rounded-xl bg-[#596522] opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100"
          />
        )}
        <span
          className={clsx(
            "relative z-10 mr-2.5 h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
            active
              ? "bg-white"
              : "bg-[#D8BB7A] group-hover:bg-white dark:bg-neutral-500"
          )}
        />
        <span className="relative z-10 line-clamp-1">{formatLabel(item.title)}</span>
      </DynamicTag>
    </li>
  );
}

function SortFilterItem({ item }: { item: SortFilterItemType }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("sort") === item.slug;
  const q = searchParams.get("q");

  const href = createUrl(
    pathname,
    new URLSearchParams({
      ...(q && { q }),
      ...(item.slug && item.slug.length && { sort: item.slug }),
    })
  );
  const DynamicTag = active ? "p" : Link;

  return (
    <li key={item.title}>
      <DynamicTag
        prefetch={!active ? false : undefined}
        href={href}
        className={clsx(
          "group relative flex w-full items-center overflow-hidden rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300",
          active
            ? "bg-[#596522] font-semibold text-white shadow-[0_4px_14px_rgba(89,101,34,0.35)]"
            : "text-[#303515] hover:text-white dark:text-neutral-300 dark:hover:text-white"
        )}
      >
        {!active && (
          <span
            aria-hidden
            className="absolute inset-0 origin-left scale-x-0 rounded-xl bg-[#596522] opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100"
          />
        )}
        <span
          className={clsx(
            "relative z-10 mr-2.5 h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
            active
              ? "bg-white"
              : "bg-[#D8BB7A] group-hover:bg-white dark:bg-neutral-500"
          )}
        />
        <span className="relative z-10 line-clamp-1">{item.title}</span>
      </DynamicTag>
    </li>
  );
}

export function FilterItem({ item }: { item: ListItem }) {
  return "path" in item ? (
    <PathFilterItem item={item} />
  ) : (
    <SortFilterItem item={item} />
  );
}
