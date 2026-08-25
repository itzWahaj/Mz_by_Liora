"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import Link from "next/link";

type GradientButtonProps = {
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  /** Stretch to the parent width (use instead of putting `w-full` in className). */
  fullWidth?: boolean;
};

const buttonClasses =
  "transition-brand inline-flex h-10 items-center justify-center rounded-full bg-[#596522] px-6 text-sm font-medium text-white shadow-sm hover:bg-[#C49A45] hover:shadow-[0_12px_32px_rgba(196,154,69,0.35)] disabled:cursor-not-allowed disabled:opacity-60";

export default function GradientButton({
  href,
  children,
  className,
  prefetch = false,
  type = "button",
  disabled,
  onClick,
  fullWidth = false,
}: GradientButtonProps) {
  return (
    <motion.div
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={clsx("inline-flex", fullWidth && "w-full")}
    >
      {href ? (
        <Link
          href={href}
          prefetch={prefetch}
          className={clsx(buttonClasses, fullWidth && "w-full", className)}
        >
          {children}
        </Link>
      ) : (
        <button
          type={type}
          disabled={disabled}
          onClick={onClick}
          className={clsx(buttonClasses, fullWidth && "w-full", className)}
        >
          {children}
        </button>
      )}
    </motion.div>
  );
}
