"use client";

import { useId } from "react";

interface StarRatingProps {
  rating: number; // e.g. 4.6
  reviewCount: number; // e.g. 23
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
}

export function StarIcon({
  fillPercent = 100,
  sizeClass = "h-4 w-4",
}: {
  fillPercent?: number; // 0 to 100
  sizeClass?: string;
}) {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 20 20"
      className={`${sizeClass} shrink-0 text-amber-400`}
      fill={`url(#${gradientId})`}
      stroke="currentColor"
      strokeWidth="0.8"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset={`${fillPercent}%`} stopColor="currentColor" />
          <stop
            offset={`${fillPercent}%`}
            stopColor="transparent"
            stopOpacity="1"
          />
        </linearGradient>
      </defs>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    </svg>
  );
}

export function StarsRow({
  rating = 0,
  sizeClass = "h-4 w-4",
}: {
  rating: number;
  sizeClass?: string;
}) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {stars.map((index) => {
        const fill = Math.max(0, Math.min(1, rating - (index - 1)));
        const fillPercent = Math.round(fill * 100);
        return (
          <StarIcon
            key={index}
            fillPercent={fillPercent}
            sizeClass={sizeClass}
          />
        );
      })}
    </div>
  );
}

export default function StarRating({
  rating,
  reviewCount,
  size = "md",
  interactive = true,
}: StarRatingProps) {
  const sizeMap = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };
  const sizeClass = sizeMap[size];

  const scrollToReviews = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.preventDefault();
    const reviewsEl = document.getElementById("reviews");
    if (reviewsEl) {
      reviewsEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const hasReviews = reviewCount > 0 && rating > 0;

  if (!hasReviews) {
    return (
      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
        <StarsRow rating={0} sizeClass={sizeClass} />
        {interactive ? (
          <button
            type="button"
            onClick={scrollToReviews}
            className="transition-colors hover:text-brand-teal hover:underline"
          >
            No reviews yet • Be the first to review
          </button>
        ) : (
          <span>No reviews yet</span>
        )}
      </div>
    );
  }

  const reviewLabel = reviewCount === 1 ? "review" : "reviews";

  return (
    <div className="inline-flex items-center gap-2">
      {interactive ? (
        <a
          href="#reviews"
          onClick={scrollToReviews}
          aria-label={`Rated ${rating.toFixed(1)} out of 5 stars based on ${reviewCount} ${reviewLabel}. Click to view reviews.`}
          className="group inline-flex items-center gap-2 text-sm text-neutral-700 transition-colors hover:text-brand-teal dark:text-neutral-300"
        >
          <StarsRow rating={rating} sizeClass={sizeClass} />
          <span className="font-semibold text-brand dark:text-white">
            {rating.toFixed(1)}
          </span>
          <span className="text-neutral-500 underline-offset-4 group-hover:underline dark:text-neutral-400">
            ({reviewCount} {reviewLabel})
          </span>
        </a>
      ) : (
        <div className="inline-flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <StarsRow rating={rating} sizeClass={sizeClass} />
          <span className="font-semibold text-brand dark:text-white">
            {rating.toFixed(1)}
          </span>
          <span className="text-neutral-500 dark:text-neutral-400">
            ({reviewCount} {reviewLabel})
          </span>
        </div>
      )}
    </div>
  );
}
