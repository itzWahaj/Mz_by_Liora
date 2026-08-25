"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { useWishlist } from "@/components/wishlist/wishlist-context";

export default function WishlistNavbarButton() {
  const { wishlist } = useWishlist();
  const count = wishlist.length;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 20 }}
    >
      <Link
        href="/account"
        prefetch={true}
        aria-label={`Wishlist (${count} items)`}
        title={count > 0 ? `Wishlist (${count} items saved)` : "My Wishlist"}
        className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-[#D8BB7A]/60 bg-[#FFFDF8] text-[#303515] shadow-sm backdrop-blur-sm transition-brand hover:border-[#C49A45] hover:text-[#596522] hover:shadow-[0_8px_24px_rgba(196,154,69,0.2)] dark:border-neutral-800 dark:bg-neutral-950/70 dark:text-neutral-200 dark:hover:text-white"
      >
        {count > 0 ? (
          <HeartSolid className="h-5 w-5 text-[#C49A45] transition-transform duration-300 group-hover:scale-110" />
        ) : (
          <HeartIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
        )}

        {/* Dynamic Count Badge */}
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-[#596522] px-1 text-[10px] font-bold text-white shadow-xs dark:border-neutral-950"
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    </motion.div>
  );
}
