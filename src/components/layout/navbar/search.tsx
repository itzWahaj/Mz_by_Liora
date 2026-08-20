"use client";

import Price from "@/components/price";
import { createUrl } from "@/lib/utils";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";

type SearchSuggestion = {
  handle: string;
  title: string;
  href: string;
  imageUrl: string | null;
  imageAlt: string;
  amount: string;
  currencyCode: string;
};

export default function Search() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listId = useId();
  const rootRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const clearSearch = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    setLoading(false);
  }, []);

  // Clear the input after navigating (product click, search results, etc.)
  useEffect(() => {
    clearSearch();
  }, [pathname, clearSearch]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as { products: SearchSuggestion[] };
        setSuggestions(data.products ?? []);
        setActiveIndex(-1);
        setOpen(true);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const goToSearch = useCallback(
    (value: string) => {
      const newParams = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();
      if (trimmed) newParams.set("q", trimmed);
      else newParams.delete("q");
      clearSearch();
      startTransition(() => {
        router.push(createUrl("/search", newParams));
      });
    },
    [clearSearch, router, searchParams]
  );

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      const href = suggestions[activeIndex].href;
      clearSearch();
      router.push(href);
      return;
    }
    goToSearch(query);
  }

  function onKeyDownInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      if (suggestions.length) setOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((index) =>
        suggestions.length === 0 ? -1 : (index + 1) % suggestions.length
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((index) =>
        suggestions.length === 0
          ? -1
          : (index - 1 + suggestions.length) % suggestions.length
      );
    }
  }

  const showPanel = open && query.trim().length >= 2;

  return (
    <form
      ref={rootRef}
      onSubmit={onSubmit}
      className="group relative z-40 w-full max-w-[550px] lg:w-80 xl:w-full"
      role="search"
    >
      <input
        ref={inputRef}
        type="text"
        name="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
        }
        placeholder="Search skincare & beauty..."
        autoComplete="off"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (query.trim().length >= 2) setOpen(true);
        }}
        onKeyDown={onKeyDownInput}
        className="text-md peer w-full rounded-full border border-neutral-300/90 bg-white/80 px-4 py-2 pr-10 text-black shadow-sm placeholder:text-neutral-500 transition-brand hover:border-brand-teal/50 hover:shadow-[0_8px_24px_rgba(20,184,166,0.12)] focus:border-brand-teal focus:shadow-[0_0_0_4px_rgba(20,184,166,0.18)] md:text-sm dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-white dark:placeholder:text-neutral-400 dark:hover:border-brand-teal/40 dark:focus:shadow-[0_0_0_4px_rgba(20,184,166,0.2)]"
      />
      <div className="pointer-events-none absolute right-0 top-0 mr-3 flex h-full items-center text-neutral-500 transition-colors peer-focus:text-brand-teal group-hover:text-brand-teal">
        <MagnifyingGlassIcon className="h-4" />
      </div>

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          data-lenis-prevent
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white/95 shadow-[0_20px_50px_rgba(15,23,42,0.16)] backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/95"
        >
          {loading && suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-500">Searching…</p>
          ) : suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-500">
              No products match &quot;{query.trim()}&quot;
            </p>
          ) : (
            <ul
              data-lenis-prevent
              className="max-h-[min(24rem,70vh)] overflow-y-auto overscroll-contain py-1.5"
              onWheel={(event) => event.stopPropagation()}
            >
              {suggestions.map((product, index) => {
                const active = index === activeIndex;
                return (
                  <li key={product.handle} role="option" aria-selected={active}>
                    <Link
                      id={`${listId}-option-${index}`}
                      href={product.href}
                      onClick={clearSearch}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={
                        active
                          ? "flex items-center gap-3 bg-brand-gradient px-3 py-2.5 text-white"
                          : "flex items-center gap-3 px-3 py-2.5 text-brand transition-colors hover:bg-brand-teal/10 dark:text-white dark:hover:bg-brand-teal/15"
                      }
                    >
                      <span
                        className={
                          active
                            ? "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/30 bg-white/15"
                            : "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900"
                        }
                      >
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.imageAlt}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Image
                            src="/logo.png"
                            alt="MZ by LIORA"
                            width={32}
                            height={32}
                            className="h-8 w-8 object-contain opacity-80"
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {product.title}
                        </span>
                        <Price
                          className={
                            active
                              ? "mt-0.5 text-xs text-white/90"
                              : "mt-0.5 text-xs text-neutral-500 dark:text-neutral-400"
                          }
                          amount={product.amount}
                          currencyCode={product.currencyCode}
                          currencyCodeClassName={
                            active ? "text-white/80" : undefined
                          }
                        />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={() => goToSearch(query)}
            className="flex w-full items-center justify-between border-t border-neutral-200 px-4 py-2.5 text-left text-sm font-medium text-brand transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-white dark:hover:bg-neutral-900"
          >
            <span>
              View all results for &quot;{query.trim()}&quot;
            </span>
            <MagnifyingGlassIcon className="h-4 w-4 text-brand-teal" />
          </button>
        </div>
      ) : null}
    </form>
  );
}

export function SearchSkeleton() {
  return (
    <form className="w-max-[550px] relative w-full lg:w-80 xl:w-full">
      <input
        type="text"
        placeholder="Search skincare & beauty..."
        className="w-full rounded-full border border-neutral-300/90 bg-white/80 px-4 py-2 text-sm text-black shadow-sm placeholder:text-neutral-500 transition-brand focus:border-brand-teal focus:shadow-[0_0_0_4px_rgba(20,184,166,0.18)] dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-white dark:placeholder:text-neutral-400 dark:focus:shadow-[0_0_0_4px_rgba(20,184,166,0.2)]"
      />
      <div className="absolute right-0 top-0 mr-3 flex h-full items-center text-neutral-500">
        <MagnifyingGlassIcon className="h-4" />
      </div>
    </form>
  );
}
