"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ListItem } from ".";
import { FilterItem } from "./item";

function formatLabel(title: string) {
  if (title.includes(" ") || title !== title.toLowerCase()) return title;
  return title
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function FilterItemDropDown({
  list,
  onOpenChange,
}: {
  list: ListItem[];
  onOpenChange?: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState("");
  const [openSelect, setOpenSelect] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toggleSelect = () => {
    setOpenSelect((prev) => {
      const next = !prev;
      onOpenChange?.(next);
      return next;
    });
  };

  const closeSelect = () => {
    setOpenSelect(false);
    onOpenChange?.(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        closeSelect();
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    let nextActive = "";
    list.forEach((listItem: ListItem) => {
      if (
        ("path" in listItem && pathname === listItem.path) ||
        ("slug" in listItem && searchParams.get("sort") === listItem.slug)
      ) {
        nextActive = listItem.title;
      }
    });
    setActive(nextActive || list[0]?.title || "");
  }, [pathname, list, searchParams]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggleSelect}
        aria-expanded={openSelect}
        className="flex w-full items-center justify-between rounded-2xl border border-[#D8BB7A]/60 bg-[#FFFDF8] px-4 py-3 text-left text-sm font-medium text-[#303515] shadow-sm transition-brand hover:border-[#C49A45] dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
      >
        <span className="line-clamp-1">{formatLabel(active)}</span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-[#596522] transition-transform ${
            openSelect ? "rotate-180" : ""
          }`}
        />
      </button>
      {openSelect ? (
        <div
          onClick={closeSelect}
          className="absolute left-0 top-full z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-[#D8BB7A] bg-[#FFFDF8] p-2 shadow-[0_20px_50px_rgba(48,53,21,0.22)] dark:border-neutral-800 dark:bg-neutral-950"
        >
          <ul className="space-y-1">
            {list.map((item: ListItem, i) => (
              <FilterItem item={item} key={i} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
