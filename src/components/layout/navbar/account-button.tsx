"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { UserIcon } from "@heroicons/react/24/outline";

export default function AccountButton() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated) {
            setIsAuthenticated(true);
            setCustomerName(data.customer?.firstName || data.customer?.displayName || "");
          }
        }
      } catch {
        // Fallback to unauthenticated on error
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 20 }}
    >
      <Link
        href={isAuthenticated ? "/account" : "/account/login"}
        prefetch={true}
        aria-label={
          isAuthenticated
            ? `My Account${customerName ? ` (${customerName})` : ""}`
            : "Customer Account Sign In"
        }
        title={
          isAuthenticated
            ? `My Account${customerName ? ` (${customerName})` : ""}`
            : "Sign In / Account"
        }
        className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-[#D8BB7A]/60 bg-[#FFFDF8] text-[#303515] shadow-sm backdrop-blur-sm transition-brand hover:border-[#C49A45] hover:text-[#596522] hover:shadow-[0_8px_24px_rgba(196,154,69,0.2)] dark:border-neutral-800 dark:bg-neutral-950/70 dark:text-neutral-200 dark:hover:text-white"
      >
        <UserIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />

        {/* Logged in indicator dot */}
        {isAuthenticated && (
          <span className="absolute right-1 top-1 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
          </span>
        )}
      </Link>
    </motion.div>
  );
}
