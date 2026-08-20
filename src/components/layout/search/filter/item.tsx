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
          "group relative flex w-full items-center rounded-xl px-3 py-2.5 text-sm transition-brand",
          active
            ? "bg-brand-gradient font-medium text-white shadow-[0_8px_24px_rgba(30,95,191,0.28)]"
            : "text-neutral-700 hover:bg-brand-blue/5 hover:text-brand-blue-dark dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-white"
        )}
      >
        <span
          className={clsx(
            "mr-2.5 h-1.5 w-1.5 shrink-0 rounded-full transition-brand",
            active
              ? "bg-white"
              : "bg-neutral-300 group-hover:bg-brand-teal dark:bg-neutral-600"
          )}
        />
        <span className="line-clamp-1">{formatLabel(item.title)}</span>
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
          "group relative flex w-full items-center rounded-xl px-3 py-2.5 text-sm transition-brand",
          active
            ? "bg-brand-gradient font-medium text-white shadow-[0_8px_24px_rgba(20,184,166,0.25)]"
            : "text-neutral-700 hover:bg-brand-teal/10 hover:text-brand-teal dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-white"
        )}
      >
        <span
          className={clsx(
            "mr-2.5 h-1.5 w-1.5 shrink-0 rounded-full transition-brand",
            active
              ? "bg-white"
              : "bg-neutral-300 group-hover:bg-brand-coral dark:bg-neutral-600"
          )}
        />
        <span className="line-clamp-1">{item.title}</span>
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
