"use client";

import GradientButton from "@/components/ui/gradient-button";
import { FormEvent, useEffect, useState } from "react";
import { SparklesIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

declare global {
  interface Window {
    _learnq?: Array<unknown>;
  }
}

async function subscribeEmail(email: string): Promise<void> {
  // Fire onsite tracking event (non-blocking, best-effort)
  if (typeof window !== "undefined") {
    window._learnq = window._learnq || [];
    window._learnq.push(["identify", { $email: email }]);
    window._learnq.push(["track", "Subscribed to Newsletter", { $email: email }]);
  }

  // Server-side subscription (profile create + list add via private API key)
  const res = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(
      (data as { error?: string } | null)?.error ||
        "Could not subscribe. Please try again."
    );
  }
}

export default function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [memberName, setMemberName] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function checkMember() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated) {
            setIsMember(true);
            setMemberName(data.customer?.firstName || data.customer?.displayName || "");
          }
        }
      } catch {
        // Fallback
      }
    }
    checkMember();
    return () => {
      isMounted = false;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!value || status === "submitting") return;

    setStatus("submitting");
    setErrorMessage(null);
    try {
      await subscribeEmail(value);
      setStatus("success");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    }
  }

  return (
    <div className="w-full border-b border-[#D8BB7A]/30 pb-10 dark:border-neutral-800">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="max-w-xl space-y-2">
          <h3 className="font-display text-3xl font-bold tracking-tight text-[#4D581E] sm:text-4xl dark:text-white">
            Join the Ritual
          </h3>
          <p className="font-sans text-sm leading-relaxed text-[#303515]/80 dark:text-neutral-400 md:text-base">
            New formulas, restock alerts, and skincare notes from MZ by LIORA —
            straight to your inbox.
          </p>
        </div>

        <div className="w-full max-w-xl shrink-0">
          {isMember ? (
            <div className="flex items-center gap-3.5 rounded-full border border-[#D8BB7A]/60 bg-[#FFFDF8] px-6 py-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#596522]/10 text-[#596522]">
                <SparklesIcon className="h-4 w-4 text-[#C49A45]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#4D581E] dark:text-[#D8BB7A]">
                  {memberName ? `${memberName}, you're part of the ritual` : "You're subscribed to the ritual"}
                </p>
                <p className="text-xs text-[#303515]/70 dark:text-neutral-400">
                  Receiving VIP botanical skincare notes & exclusive member drops.
                </p>
              </div>
            </div>
          ) : status === "success" ? (
            <p
              className="rounded-full bg-[#596522] px-5 py-2.5 text-center text-sm font-medium text-white"
              role="status"
            >
              You&apos;re in. Welcome to the ritual.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                <label htmlFor="footer-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={email}
                  disabled={status === "submitting"}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (status === "error") {
                      setStatus("idle");
                      setErrorMessage(null);
                    }
                  }}
                  placeholder="you@email.com"
                  className="h-12 min-w-0 w-full flex-1 rounded-full border border-[#D8BB7A]/60 bg-[#FFFDF8]/90 px-6 py-0 font-sans text-sm leading-[48px] text-[#303515] shadow-sm outline-none transition-brand placeholder:text-[#303515]/50 hover:border-[#C49A45] hover:shadow-[0_8px_24px_rgba(196,154,69,0.12)] focus:border-[#C49A45] focus:shadow-[0_0_0_4px_rgba(196,154,69,0.18)] disabled:opacity-60 sm:text-base dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-white dark:placeholder:text-neutral-500 dark:hover:border-[#D8BB7A] dark:focus:shadow-[0_0_0_4px_rgba(196,154,69,0.2)]"
                />
                <div className="w-full shrink-0 sm:w-auto">
                  <GradientButton
                    type="submit"
                    disabled={status === "submitting"}
                    fullWidth
                    className="h-12 px-8 text-base font-semibold sm:w-auto"
                  >
                    {status === "submitting" ? "Subscribing…" : "Subscribe"}
                  </GradientButton>
                </div>
              </div>
              {status === "error" ? (
                <p className="px-2 font-sans text-xs text-[#C49A45]" role="alert">
                  {errorMessage || "Something went wrong. Please try again."}
                </p>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
