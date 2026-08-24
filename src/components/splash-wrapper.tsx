"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

// Load the heavy canvas/animation component only client-side
const SplashScreen = dynamic(() => import("@/components/splash-screen"), {
  ssr: false,
});

const SESSION_KEY = "mz-splash-shown";

export default function SplashWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Three states:
  //   "pending"  — haven't checked sessionStorage yet (SSR-safe)
  //   "showing"  — splash is visible
  //   "done"     — splash finished, show site
  const [state, setState] = useState<"pending" | "showing" | "done">("pending");

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem(SESSION_KEY);
      if (seen) {
        setState("done");
      } else {
        setState("showing");
      }
    } catch {
      // Private browsing / storage blocked
      setState("done");
    }
  }, []);

  function handleComplete() {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore
    }
    setState("done");
  }

  // Still checking — render nothing to avoid flash
  if (state === "pending") return null;

  return (
    <>
      <AnimatePresence mode="wait">
        {state === "showing" && (
          <SplashScreen key="splash" onComplete={handleComplete} minDuration={1400} />
        )}
      </AnimatePresence>
      {/* Site content — render in background while splash plays so it pre-loads */}
      <div
        style={{
          opacity: state === "done" ? 1 : 0,
          transition: "opacity 0.6s ease",
          pointerEvents: state === "done" ? "auto" : "none",
        }}
      >
        {children}
      </div>
    </>
  );
}
