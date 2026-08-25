"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SparklesIcon, TruckIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

const ANNOUNCEMENTS = [
  {
    id: 1,
    icon: TruckIcon,
    badge: "Free Delivery",
    text: "Complimentary Shipping Nationwide — No Separate Delivery Charges on All Orders!",
  },
  {
    id: 2,
    icon: SparklesIcon,
    badge: "Pure Rituals",
    text: "100% Pure Botanical Formulations • Formulated for Purity, Calm & Radiance",
  },
  {
    id: 3,
    icon: ChatBubbleLeftRightIcon,
    badge: "Skincare Support",
    text: "Need Guidance? Tap the WhatsApp button for Personalized Ritual Advice",
  },
];

export default function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const current = ANNOUNCEMENTS[currentIndex] || ANNOUNCEMENTS[0];
  const Icon = current.icon;

  return (
    <div className="relative z-[110] overflow-hidden border-b border-[#D8BB7A]/40 bg-[#4D581E] text-white select-none">
      {/* Subtle gold sheen background line */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-[#C49A45]/20 to-transparent opacity-60" />

      <div className="mx-auto flex h-9 max-w-screen-2xl items-center justify-center px-4 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex items-center justify-center gap-2 text-[11px] sm:text-xs font-medium tracking-wide"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-[#D8BB7A]" />
            <span className="hidden rounded-full bg-[#596522] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FAF9F4] sm:inline-block border border-[#D8BB7A]/50">
              {current.badge}
            </span>
            <span className="truncate text-[#FAF9F4] font-medium">
              {current.text}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
