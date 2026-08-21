"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";
import Image from "next/image";

function WhatsAppIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.45 1.03 2.62.13.17 1.77 2.71 4.3 3.8.6.26 1.07.42 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.31z" />
    </svg>
  );
}

export default function WhatsAppButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Exclude checkout to prevent purchase flow distraction
  const isExcluded = Boolean(
    pathname && (pathname.startsWith("/checkout") || pathname === "/checkout")
  );

  const rawPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "923170692214";
  const phone = rawPhone.replace(/\D/g, "").replace(/^0/, "92") || "923170692214";
  const defaultGreeting = "Hi! I have a question about MZ by LIORA products.";

  const handleSendMessage = useCallback(() => {
    const text = message.trim() || defaultGreeting;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setMessage("");
    setIsOpen(false);
  }, [message, phone, defaultGreeting]);

  // Close when clicking outside panel and button
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    // Auto-focus input when opened
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(focusTimer);
    };
  }, [isOpen]);

  if (isExcluded) return null;

  return (
    <div ref={panelRef} className="fixed bottom-5 right-5 z-[90] sm:bottom-6 sm:right-6">
      {/* Floating Chat Widget Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ type: "spring", stiffness: 360, damping: 26 }}
            className="absolute bottom-16 right-0 mb-2 w-[calc(100vw-2.5rem)] max-w-[380px] overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-2xl backdrop-blur-xl sm:w-[380px] dark:border-neutral-800 dark:bg-neutral-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-[#075E54] px-4 py-3.5 text-white dark:bg-[#128C7E]">
              <div className="flex items-center gap-3">
                {/* Brand Avatar with Online Indicator */}
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
                  <Image
                    src="/favicon-192.png"
                    alt="MZ by LIORA"
                    width={36}
                    height={36}
                    className="h-8 w-8 object-contain"
                  />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white leading-tight">MZ by LIORA</h3>
                  <p className="text-[11px] text-white/80">Typically replies in minutes</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="rounded-full p-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Body (Simulated conversation) */}
            <div
              className="h-[280px] sm:h-[320px] p-4 bg-[#EFEAE2] dark:bg-[#0B141A] flex flex-col justify-between overflow-y-auto"
              style={{
                backgroundImage: `radial-gradient(#CBD5E1 0.75px, transparent 0.75px)`,
                backgroundSize: "16px 16px",
              }}
            >
              <div className="space-y-3">
                {/* Date pill */}
                <div className="flex justify-center">
                  <span className="rounded-lg bg-white/80 dark:bg-[#182229] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-500 shadow-sm">
                    Today
                  </span>
                </div>

                {/* Encryption notice */}
                <div className="flex justify-center">
                  <span className="rounded-lg bg-[#FFEECD] dark:bg-[#182229] px-3 py-1 text-center text-[10px] text-neutral-600 dark:text-neutral-300 shadow-xs max-w-[90%]">
                    🔒 Messages are end-to-end encrypted. Tap to chat with our team on WhatsApp.
                  </span>
                </div>

                {/* Incoming Bubble */}
                <div className="flex flex-col items-start space-y-1">
                  <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white p-3.5 text-xs leading-relaxed text-neutral-800 shadow-sm dark:bg-[#202C33] dark:text-neutral-100">
                    <p className="font-semibold text-brand-teal text-[11px] mb-1">
                      MZ by LIORA Support
                    </p>
                    <p>
                      Hi there! Welcome to MZ by LIORA. How can we assist you with your skincare ritual today? 👋
                    </p>
                    <span className="mt-1.5 block text-right text-[10px] text-neutral-400">
                      Just now
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {[
                  "Product Consultation",
                  "Order Inquiry",
                  "Skin Type Advice",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setMessage(chip);
                      inputRef.current?.focus();
                    }}
                    className="rounded-full border border-neutral-300/80 bg-white/90 px-2.5 py-1 text-[10px] font-medium text-neutral-700 shadow-xs transition-colors hover:border-brand-teal hover:bg-white hover:text-brand-teal dark:border-neutral-700 dark:bg-[#202C33] dark:text-neutral-300 dark:hover:text-white"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 border-t border-neutral-200/80 bg-[#F0F2F5] p-2.5 dark:border-neutral-800 dark:bg-[#202C33]"
            >
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-full border border-neutral-300/80 bg-white px-4 py-2 text-xs text-neutral-800 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-teal dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
              <button
                type="submit"
                aria-label="Send message on WhatsApp"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <motion.button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close WhatsApp chat" : "Open WhatsApp chat"}
        title="Chat with us on WhatsApp"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 380, damping: 20 }}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_6px_20px_rgba(37,211,102,0.4)] transition-shadow duration-300 hover:shadow-[0_8px_28px_rgba(37,211,102,0.6)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <XMarkIcon className="h-7 w-7 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="whatsapp-icon"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <WhatsAppIcon className="h-8 w-8 text-white transition-transform duration-300 group-hover:scale-105" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread notification ping dot when closed */}
        {!isOpen && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
          </span>
        )}
      </motion.button>
    </div>
  );
}
