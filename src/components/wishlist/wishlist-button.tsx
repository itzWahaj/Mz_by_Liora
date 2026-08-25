"use client";

import { useWishlist } from "./wishlist-context";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useState } from "react";

export default function WishlistButton({
  productId,
  productTitle,
  variant = "floating",
  className = "",
}: {
  productId: string;
  productTitle?: string;
  variant?: "floating" | "inline" | "pdp";
  className?: string;
}) {
  const { isInWishlist, toggleWishlist, isLoading } = useWishlist();
  const isSaved = isInWishlist(productId);
  const [isToggling, setIsToggling] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (isToggling) return;
    setIsToggling(true);
    try {
      await toggleWishlist(productId, productTitle);
    } finally {
      setIsToggling(false);
    }
  }

  if (variant === "pdp") {
    return (
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={isToggling}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
        className={`flex w-full items-center justify-center gap-2.5 rounded-full border py-3 px-6 text-sm font-semibold transition-all duration-300 ${
          isSaved
            ? "border-[#D8BB7A] bg-[#FFFDF8] text-[#596522] shadow-sm hover:border-[#C49A45] hover:bg-[#FAF9F4] dark:border-[#D8BB7A]/40 dark:bg-neutral-900 dark:text-[#D8BB7A]"
            : "border-[#D8BB7A]/60 bg-[#FAF9F4] text-[#303515] hover:border-[#C49A45] hover:bg-white hover:text-[#596522] dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-200"
        } ${className}`}
      >
        <motion.div
          animate={isSaved ? { scale: [1, 1.35, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {isSaved ? (
            <HeartSolid className="h-5 w-5 text-[#C49A45] drop-shadow-xs" />
          ) : (
            <HeartOutline className="h-5 w-5 text-[#596522]" />
          )}
        </motion.div>
        <span>{isSaved ? "Saved to Wishlist" : "Add to Wishlist"}</span>
      </motion.button>
    );
  }

  if (variant === "inline") {
    return (
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={isToggling}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
        className={`flex h-9 w-9 items-center justify-center rounded-full border border-[#D8BB7A]/50 bg-[#FFFDF8] text-[#303515] shadow-xs backdrop-blur-sm transition-all hover:border-[#C49A45] hover:text-[#596522] dark:border-neutral-700 dark:bg-neutral-900 ${className}`}
      >
        <motion.div
          animate={isSaved ? { scale: [1, 1.4, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {isSaved ? (
            <HeartSolid className="h-4 w-4 text-[#C49A45]" />
          ) : (
            <HeartOutline className="h-4 w-4 text-[#303515]/80 group-hover:text-[#596522]" />
          )}
        </motion.div>
      </motion.button>
    );
  }

  // Floating button for product cards (top-right overlay)
  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={isToggling}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.88 }}
      aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
      className={`absolute top-3 right-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border shadow-md backdrop-blur-md transition-all duration-300 ${
        isSaved
          ? "border-[#D8BB7A] bg-[#FFFDF8]/95 text-[#C49A45] shadow-[0_4px_14px_rgba(196,154,69,0.25)]"
          : "border-[#D8BB7A]/40 bg-[#FAF9F4]/90 text-[#303515]/75 hover:border-[#C49A45] hover:bg-white hover:text-[#596522]"
      } ${className}`}
    >
      <motion.div
        animate={isSaved ? { scale: [1, 1.45, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {isSaved ? (
          <HeartSolid className="h-5 w-5 text-[#C49A45] drop-shadow-xs" />
        ) : (
          <HeartOutline className="h-5 w-5" />
        )}
      </motion.div>
    </motion.button>
  );
}
