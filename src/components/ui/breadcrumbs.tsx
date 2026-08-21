import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export type BreadcrumbItem = {
  name: string;
  href?: string;
};

export default function Breadcrumbs({
  items,
  className = "",
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center text-xs font-medium text-neutral-500 dark:text-neutral-400 ${className}`}
    >
      <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <li key={`${item.name}-${index}`} className="flex items-center gap-1.5 sm:gap-2">
              {index > 0 && (
                <ChevronRightIcon className="h-3 w-3 shrink-0 text-neutral-400 dark:text-neutral-600" />
              )}
              {isLast || !item.href ? (
                <span
                  className="max-w-[200px] truncate font-semibold text-brand sm:max-w-none dark:text-white"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  prefetch={true}
                  className="transition-colors hover:text-brand-teal"
                >
                  {isFirst ? (
                    <span className="flex items-center gap-1">
                      <HomeIcon className="h-3.5 w-3.5" />
                      <span>{item.name}</span>
                    </span>
                  ) : (
                    <span>{item.name}</span>
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
