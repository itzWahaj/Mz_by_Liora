"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useTheme } from "@/components/providers/theme-provider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
      onClick={toggleTheme}
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.96 }}
      className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300/90 bg-white/80 text-brand shadow-sm transition-brand hover:border-brand-teal/50 hover:bg-brand-gradient hover:text-white hover:shadow-[0_8px_20px_rgba(30,95,191,0.28)] dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-white dark:hover:border-transparent"
    >
      {isDark ? (
        <SunIcon className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
      ) : (
        <MoonIcon className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12" />
      )}
    </motion.button>
  );
}
