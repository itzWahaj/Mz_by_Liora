"use client";

import GradientButton from "@/components/ui/gradient-button";
import { FormEvent, useState } from "react";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

async function subscribeEmail(email: string): Promise<void> {
  const response = await fetch("/api/newsletter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error || "Subscribe failed");
  }
}

export default function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    <div className="w-full border-b border-brand-teal/15 pb-10 dark:border-neutral-800">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="max-w-xl space-y-2">
          <h3 className="font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl dark:text-white">
            Join the Ritual
          </h3>
          <p className="font-sans text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 md:text-base">
            New formulas, restock alerts, and skincare notes from MZ by LIORA —
            straight to your inbox.
          </p>
        </div>

        <div className="w-full max-w-xl shrink-0">
          {status === "success" ? (
            <p
              className="rounded-full bg-brand-gradient px-5 py-2.5 text-center text-sm font-medium text-white"
              role="status"
            >
              You&apos;re in. Welcome to the ritual.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-2">
              <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center">
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
                  className="h-10 min-w-0 w-full flex-1 rounded-full border border-neutral-300/90 bg-white/80 px-4 font-sans text-sm text-brand shadow-sm outline-none transition-brand placeholder:text-neutral-500 hover:border-brand-teal/50 hover:shadow-[0_8px_24px_rgba(20,184,166,0.12)] focus:border-brand-teal focus:shadow-[0_0_0_4px_rgba(20,184,166,0.18)] disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-white dark:placeholder:text-neutral-400 dark:hover:border-brand-teal/40 dark:focus:shadow-[0_0_0_4px_rgba(20,184,166,0.2)]"
                />
                <div className="w-full shrink-0 sm:w-auto">
                  <GradientButton
                    type="submit"
                    disabled={status === "submitting"}
                    fullWidth
                    className="h-10 px-6 sm:w-auto"
                  >
                    {status === "submitting" ? "Subscribing…" : "Subscribe"}
                  </GradientButton>
                </div>
              </div>
              {status === "error" ? (
                <p className="font-sans text-xs text-brand-coral" role="alert">
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
