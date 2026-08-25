"use client";

import { SortFilterItem } from "@/lib/constants";
import {
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Suspense, useState } from "react";
import FilterItemDropDown from "./dropdown";
import { FilterItem } from "./item";

export type PathFilterItem = { title: string; path: string };
export type ListItem = SortFilterItem | PathFilterItem;

function FilterItemList({ list }: { list: ListItem[] }) {
  return (
    <ul className="space-y-1">
      {list.map((item: ListItem, i) => (
        <FilterItem key={i} item={item} />
      ))}
    </ul>
  );
}

function PanelIcon({ title }: { title?: string }) {
  if (title?.toLowerCase().includes("sort")) {
    return <AdjustmentsHorizontalIcon className="h-4 w-4 text-[#C49A45]" />;
  }
  return <Squares2X2Icon className="h-4 w-4 text-[#596522]" />;
}

export default function FilterList({
  list,
  title,
}: {
  list: ListItem[];
  title?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      aria-label={title || "Filters"}
      className={clsx(
        "relative rounded-2xl border border-[#D8BB7A]/60 bg-[#FFFDF8]/95 shadow-[0_12px_40px_rgba(48,53,21,0.06)] backdrop-blur-sm transition-all dark:border-neutral-800 dark:bg-neutral-950/80 dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
        isOpen ? "z-50" : "z-30 overflow-visible"
      )}
    >
      {title ? (
        <div className="flex items-center gap-2 rounded-t-2xl border-b border-[#D8BB7A]/30 px-4 py-3 dark:border-neutral-800">
          <PanelIcon title={title} />
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#C49A45]">
              Browse
            </p>
            <h3 className="font-display text-lg font-semibold leading-none tracking-tight text-[#4D581E] dark:text-white">
              {title}
            </h3>
          </div>
        </div>
      ) : null}

      <div className="hidden p-2 md:block">
        <Suspense fallback={null}>
          <FilterItemList list={list} />
        </Suspense>
      </div>

      <div className="p-3 md:hidden">
        <Suspense fallback={null}>
          <FilterItemDropDown list={list} onOpenChange={setIsOpen} />
        </Suspense>
      </div>
    </nav>
  );
}
