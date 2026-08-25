import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";

export default function OpenCart({
  className,
  quantity,
}: {
  className?: string;
  quantity?: number;
}) {
  return (
    <div className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-[#D8BB7A]/60 bg-[#FFFDF8]/90 text-[#303515] shadow-sm transition-brand hover:border-[#C49A45] hover:bg-[#596522] hover:text-white hover:shadow-[0_8px_20px_rgba(89,101,34,0.3)] dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-white dark:hover:border-transparent">
      <ShoppingCartIcon
        className={clsx(
          "h-4 transition-transform duration-300 ease-out group-hover:scale-110",
          className
        )}
      />

      <AnimatePresence>
        {quantity ? (
          <motion.div
            key={quantity}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: "spring", damping: 14, stiffness: 360 }}
            className="absolute right-0 top-0 -mr-2 -mt-2 grid h-4 min-w-4 place-content-center rounded-full bg-[#C49A45] px-1 text-[10px] font-bold leading-none text-white shadow-[0_4px_12px_rgba(196,154,69,0.45)]"
          >
            {quantity}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
