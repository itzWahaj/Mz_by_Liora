"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { HeartIcon as HeartOutline, XMarkIcon } from "@heroicons/react/24/outline";

type ToastMessage = {
  id: number;
  type: "success" | "remove" | "error" | "info";
  message: string;
  title?: string;
};

type WishlistContextType = {
  wishlist: string[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string, productTitle?: string) => Promise<boolean>;
  isLoading: boolean;
  itemCount: number;
};

const WishlistContext = createContext<WishlistContextType>({
  wishlist: [],
  isInWishlist: () => false,
  toggleWishlist: async () => false,
  isLoading: false,
  itemCount: 0,
});

export function WishlistProvider({
  children,
  initialWishlist = [],
}: {
  children: React.ReactNode;
  initialWishlist?: string[];
}) {
  const [wishlist, setWishlist] = useState<string[]>(initialWishlist);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const router = useRouter();

  // Load initial wishlist state on client mount
  useEffect(() => {
    let isMounted = true;
    async function syncWishlist() {
      try {
        const res = await fetch("/api/wishlist", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated && Array.isArray(data.wishlist)) {
            setWishlist(data.wishlist);
          }
        }
      } catch {
        // Fallback silently if offline/guest
      }
    }
    syncWishlist();
    return () => {
      isMounted = false;
    };
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Date.now();
    setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => {
      if (!productId) return false;
      return wishlist.some(
        (id) =>
          id === productId ||
          id.endsWith(productId) ||
          productId.endsWith(id)
      );
    },
    [wishlist]
  );

  const toggleWishlist = useCallback(
    async (productId: string, productTitle?: string): Promise<boolean> => {
      if (!productId) return false;

      const currentlyIn = isInWishlist(productId);

      // Optimistic update
      setWishlist((prev) =>
        currentlyIn
          ? prev.filter((id) => id !== productId && !id.endsWith(productId))
          : [...prev, productId]
      );

      setIsLoading(true);

      try {
        const res = await fetch("/api/wishlist/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });

        if (res.status === 401) {
          // Revert optimistic update
          setWishlist((prev) =>
            currentlyIn ? [...prev, productId] : prev.filter((id) => id !== productId)
          );

          addToast({
            type: "error",
            title: "Sign In Required",
            message: "Please log in to save items to your personal wishlist.",
          });

          // Redirect to login preserving current location
          if (typeof window !== "undefined") {
            const currentPath = window.location.pathname + window.location.search;
            router.push(`/account/login?returnTo=${encodeURIComponent(currentPath)}`);
          }
          return false;
        }

        if (!res.ok) {
          throw new Error(`Failed to toggle wishlist item: ${res.status}`);
        }

        const data = await res.json();
        if (Array.isArray(data.wishlist)) {
          setWishlist(data.wishlist);
        }

        if (data.inWishlist) {
          addToast({
            type: "success",
            title: "Saved to Wishlist ✨",
            message: productTitle
              ? `"${productTitle}" is saved to your account.`
              : "Item added to your wishlist.",
          });
        } else {
          addToast({
            type: "remove",
            title: "Removed from Wishlist",
            message: productTitle
              ? `"${productTitle}" was removed from your wishlist.`
              : "Item removed from your wishlist.",
          });
        }

        return Boolean(data.inWishlist);
      } catch (err) {
        console.error("Wishlist toggle error:", err);
        // Revert optimistic update on failure
        setWishlist((prev) =>
          currentlyIn ? [...prev, productId] : prev.filter((id) => id !== productId)
        );

        addToast({
          type: "error",
          title: "Wishlist Update Failed",
          message: "Unable to sync with your account. Please try again.",
        });
        return currentlyIn;
      } finally {
        setIsLoading(false);
      }
    },
    [isInWishlist, addToast, router]
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isInWishlist,
        toggleWishlist,
        isLoading,
        itemCount: wishlist.length,
      }}
    >
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 flex-col items-center gap-2 pointer-events-none w-full max-w-sm px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`pointer-events-auto flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md ${
                toast.type === "success"
                  ? "border-[#D8BB7A] bg-[#FAF9F4]/95 text-[#303515] dark:bg-neutral-900/95 dark:text-white"
                  : toast.type === "remove"
                  ? "border-[#D8BB7A]/40 bg-[#FFFDF8]/95 text-[#303515]/80 dark:bg-neutral-900/95 dark:text-neutral-200"
                  : "border-red-300 bg-red-50/95 text-red-900 dark:bg-red-950/90 dark:text-red-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    toast.type === "success"
                      ? "bg-[#596522] text-white"
                      : toast.type === "remove"
                      ? "bg-[#D8BB7A]/30 text-[#596522]"
                      : "bg-red-200 text-red-700"
                  }`}
                >
                  {toast.type === "success" ? (
                    <HeartSolid className="h-4 w-4 text-[#FAF9F4]" />
                  ) : (
                    <HeartOutline className="h-4 w-4" />
                  )}
                </div>
                <div>
                  {toast.title && (
                    <p className="font-semibold text-xs text-[#4D581E] dark:text-[#D8BB7A]">
                      {toast.title}
                    </p>
                  )}
                  <p className="text-[11px] leading-tight text-[#303515]/80 dark:text-neutral-300">
                    {toast.message}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 text-[#303515]/50 hover:text-[#303515] dark:text-neutral-400"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
