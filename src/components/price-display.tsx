import clsx from "clsx";

export interface DiscountInfo {
  hasDiscount: boolean;
  discountPercentage: number;
  savingsAmount: number;
}

/**
 * Calculates discount percentage and checks validity.
 * Only returns hasDiscount: true when compareAt is strictly greater than current price.
 */
export function calculateDiscount(
  amount: string | number,
  compareAtAmount?: string | number | null
): DiscountInfo {
  const current = typeof amount === "string" ? parseFloat(amount) : amount;
  const compareAt = compareAtAmount
    ? typeof compareAtAmount === "string"
      ? parseFloat(compareAtAmount)
      : compareAtAmount
    : 0;

  if (
    !compareAt ||
    compareAt <= current ||
    current <= 0 ||
    isNaN(current) ||
    isNaN(compareAt)
  ) {
    return { hasDiscount: false, discountPercentage: 0, savingsAmount: 0 };
  }

  const percentage = Math.round(((compareAt - current) / compareAt) * 100);

  if (percentage <= 0) {
    return { hasDiscount: false, discountPercentage: 0, savingsAmount: 0 };
  }

  return {
    hasDiscount: true,
    discountPercentage: percentage,
    savingsAmount: compareAt - current,
  };
}

export function formatPrice(amount: string | number, currencyCode: string = "USD") {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return amount;

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "narrowSymbol",
  }).format(numericAmount);
}

export function DiscountBadge({
  percentage,
  className,
  prefix = "-",
  suffix = "%",
}: {
  percentage: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}) {
  if (!percentage || percentage <= 0) return null;

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full bg-gradient-to-r from-brand-coral to-rose-500 px-2 py-0.5 text-[11px] font-bold leading-none tracking-tight text-white shadow-sm ring-1 ring-white/20",
        className
      )}
      aria-label={`${percentage}% discount`}
    >
      {prefix}
      {percentage}
      {suffix}
    </span>
  );
}

export interface PriceDisplayProps {
  amount: string;
  compareAtAmount?: string | null;
  currencyCode: string;
  className?: string;
  priceClassName?: string;
  compareAtClassName?: string;
  currencyCodeClassName?: string;
  showBadge?: boolean;
  badgeClassName?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export default function PriceDisplay({
  amount,
  compareAtAmount,
  currencyCode = "USD",
  className,
  priceClassName,
  compareAtClassName,
  currencyCodeClassName,
  showBadge = true,
  badgeClassName,
  size = "md",
}: PriceDisplayProps) {
  const { hasDiscount, discountPercentage } = calculateDiscount(
    amount,
    compareAtAmount
  );

  const formattedCurrent = formatPrice(amount, currencyCode);
  const formattedCompare = hasDiscount && compareAtAmount
    ? formatPrice(compareAtAmount, currencyCode)
    : null;

  const sizeClasses = {
    xs: {
      current: "text-xs font-semibold",
      compare: "text-[10px]",
      badge: "text-[10px] px-1.5 py-0.5",
    },
    sm: {
      current: "text-sm font-semibold",
      compare: "text-xs",
      badge: "text-[10px] px-1.5 py-0.5",
    },
    md: {
      current: "text-base font-semibold",
      compare: "text-xs",
      badge: "text-[11px] px-2 py-0.5",
    },
    lg: {
      current: "text-xl font-bold md:text-2xl",
      compare: "text-sm md:text-base",
      badge: "text-xs px-2.5 py-1",
    },
    xl: {
      current: "text-2xl font-bold md:text-3xl",
      compare: "text-base md:text-lg",
      badge: "text-xs px-2.5 py-1",
    },
  }[size];

  return (
    <div
      suppressHydrationWarning
      className={clsx("inline-flex flex-wrap items-center gap-2", className)}
    >
      {/* Current active price */}
      <span
        className={clsx(
          "tracking-tight",
          sizeClasses.current,
          hasDiscount ? "text-brand-coral dark:text-brand-coral" : "text-current",
          priceClassName
        )}
      >
        {formattedCurrent}
        {currencyCodeClassName !== "hidden" && (
          <span
            className={clsx(
              "ml-1 inline text-[0.8em] font-normal opacity-80",
              currencyCodeClassName
            )}
          >
            {currencyCode}
          </span>
        )}
      </span>

      {/* Strikethrough compare-at price (if discounted) */}
      {hasDiscount && formattedCompare && (
        <span
          className={clsx(
            "line-through text-neutral-400 dark:text-neutral-500",
            sizeClasses.compare,
            compareAtClassName
          )}
          aria-label={`Original price: ${formattedCompare}`}
        >
          {formattedCompare}
        </span>
      )}

      {/* Discount badge */}
      {hasDiscount && showBadge && (
        <DiscountBadge
          percentage={discountPercentage}
          className={clsx(sizeClasses.badge, badgeClassName)}
        />
      )}
    </div>
  );
}
