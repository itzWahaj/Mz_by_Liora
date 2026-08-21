"use client";

import BrandDivider from "@/components/ui/brand-divider";
import { ArrowRightIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type HeroCollection = {
  handle: string;
  title: string;
  href: string;
};

type HeroImage = {
  url: string;
  alt: string;
};

export default function HomeHero({
  title,
  description,
  collections,
  image,
}: {
  title: string;
  description: string;
  collections: readonly HeroCollection[];
  image?: HeroImage | null;
}) {
  const ambientRef = useRef<HTMLDivElement>(null);
  const blobARef = useRef<HTMLDivElement>(null);
  const blobBRef = useRef<HTMLDivElement>(null);
  const blobCRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion === null) return;
    setMotionReady(true);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      if (ambientRef.current) {
        gsap.to(ambientRef.current, {
          backgroundPosition: "75% 30%",
          scale: 1.18,
          duration: 14,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      if (blobARef.current) {
        gsap.to(blobARef.current, {
          x: 48,
          y: -36,
          scale: 1.12,
          duration: 11,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      if (blobBRef.current) {
        gsap.to(blobBRef.current, {
          x: -56,
          y: 42,
          scale: 1.2,
          duration: 15,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      if (blobCRef.current) {
        gsap.to(blobCRef.current, {
          x: 28,
          y: 50,
          rotate: 18,
          duration: 18,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    });

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  const reduceMotion = Boolean(prefersReducedMotion);

  return (
    <section
      id="home-hero"
      className="relative z-0 w-full overflow-hidden border-b border-neutral-200 bg-brand-cream pt-8 md:pt-12 lg:pt-14 dark:border-neutral-800 dark:bg-black"
    >
      <div
        ref={ambientRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-10%] transform-gpu will-change-transform bg-brand-radial opacity-35 dark:opacity-45"
        style={{ backgroundSize: "160% 160%", backgroundPosition: "35% 50%" }}
      />
      <div
        ref={blobARef}
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-8 h-72 w-72 transform-gpu will-change-transform rounded-full bg-brand-teal/30 blur-3xl dark:bg-brand-teal/25"
      />
      <div
        ref={blobBRef}
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-24 h-80 w-80 transform-gpu will-change-transform rounded-full bg-brand-blue/25 blur-3xl dark:bg-brand-blue/30"
      />
      <div
        ref={blobCRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 transform-gpu will-change-transform rounded-full bg-brand-coral/20 blur-3xl dark:bg-brand-coral/25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(250,250,249,0.35),_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(15,23,42,0.35),_transparent_60%)]"
      />

      <div className="relative px-4 pb-10 md:px-6 md:pb-14 lg:pb-16">
        {/* No backdrop-blur on this card — it softens headline glyphs in Chromium. */}
        <div className="mx-auto grid max-w-[1300px] items-center gap-8 overflow-hidden rounded-[2rem] border border-white/80 bg-white/92 px-5 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:min-h-[520px] sm:px-8 sm:py-10 md:min-h-[580px] md:grid-cols-2 md:gap-10 md:px-10 md:py-12 lg:min-h-[640px] dark:border-white/10 dark:bg-neutral-950/90 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="relative z-10 flex flex-col justify-center">
            <motion.p
              className="mb-3 text-sm uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-400"
              initial={reduceMotion || !motionReady ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              MZ by LIORA
            </motion.p>
            <h1 className="font-display text-4xl font-bold tracking-tight text-brand [text-rendering:geometricPrecision] sm:text-5xl md:text-5xl lg:text-6xl lg:leading-[1.05] dark:text-white">
              {title}
            </h1>
            <BrandDivider className="mt-6 max-w-[360px]" />
            <motion.p
              className="mt-6 max-w-[34rem] text-base leading-relaxed text-neutral-700 md:text-lg dark:text-neutral-300"
              initial={reduceMotion || !motionReady ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduceMotion ? 0 : 0.5,
                delay: reduceMotion ? 0 : 0.4,
                ease: "easeOut",
              }}
            >
              {description}
            </motion.p>
            {/* Primary and Secondary CTA Button Row */}
            <motion.div
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              initial={reduceMotion || !motionReady ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduceMotion ? 0 : 0.5,
                delay: reduceMotion ? 0 : 0.52,
                ease: "easeOut",
              }}
            >
              {/* Primary Call to Action */}
              <Link
                href="/search"
                prefetch={true}
                className="group relative inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-gradient px-7 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(30,95,191,0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(30,95,191,0.45)] active:scale-[0.98]"
              >
                <span>Shop All Products</span>
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              {/* Secondary Call to Action */}
              <Link
                href="/search/best-sellers"
                prefetch={true}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-neutral-300/80 bg-white/80 px-6 text-sm font-semibold text-brand backdrop-blur-sm transition-all duration-300 hover:border-brand-teal hover:bg-white hover:shadow-md active:scale-[0.98] dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-white dark:hover:bg-neutral-900"
              >
                <SparklesIcon className="h-4 w-4 text-brand-teal" />
                <span>Best Sellers</span>
              </Link>
            </motion.div>

            {/* Quick Explore Category Chips */}
            <motion.div
              className="mt-6 flex flex-wrap items-center gap-2"
              initial={reduceMotion || !motionReady ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduceMotion ? 0 : 0.5,
                delay: reduceMotion ? 0 : 0.6,
                ease: "easeOut",
              }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Explore:
              </span>
              {[
                { title: "Skin Care", href: "/search/skin-care" },
                { title: "Hair Care", href: "/search/hair-care" },
                { title: "New Arrivals", href: "/search/new-arrivals" },
              ].map((cat) => (
                <Link
                  key={cat.title}
                  href={cat.href}
                  prefetch={true}
                  className="rounded-full border border-neutral-200/90 bg-neutral-50/80 px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:border-brand-teal hover:bg-brand-teal/10 hover:text-brand-teal dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300 dark:hover:text-white"
                >
                  {cat.title}
                </Link>
              ))}
            </motion.div>

            {/* Trust / Quality Highlights */}
            <motion.div
              className="mt-6 flex flex-wrap items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400"
              initial={reduceMotion || !motionReady ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: reduceMotion ? 0 : 0.5,
                delay: reduceMotion ? 0 : 0.7,
              }}
            >
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-teal" />
                100% Botanical Care
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-blue" />
                Dermatologically Minded
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-coral" />
                Nationwide Delivery
              </span>
            </motion.div>
          </div>

          <motion.div
            className="relative flex min-h-[280px] items-center justify-center md:min-h-[420px]"
            initial={
              reduceMotion || !motionReady
                ? false
                : { opacity: 0, scale: 0.96, x: 18 }
            }
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.7,
              delay: reduceMotion ? 0 : 0.2,
              ease: "easeOut",
            }}
          >
            <div
              aria-hidden="true"
              className="absolute inset-6 rounded-full bg-brand-gradient opacity-30 blur-3xl dark:opacity-40"
            />
            <div className="relative aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-[1.75rem] border border-white/80 shadow-[0_30px_80px_rgba(30,95,191,0.22)] dark:border-white/10">
              {image?.url ? (
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  priority
                  sizes="(min-width: 768px) 420px, 90vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-brand-gradient-full opacity-80" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/30 via-transparent to-white/10 dark:from-black/45" />

              {/* Floating Hero Badge */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-white/50 bg-white/75 p-3 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-black/65">
                <div>
                  <p className="text-xs font-semibold text-brand dark:text-white">
                    Signature Botanical Rituals
                  </p>
                  <p className="text-[10px] text-neutral-600 dark:text-neutral-300">
                    Formulated for lasting glow & calm
                  </p>
                </div>
                <span className="rounded-full bg-brand-teal/15 px-2.5 py-0.5 text-[10px] font-semibold text-brand-teal dark:bg-brand-teal/25 dark:text-brand-teal-light">
                  100% Pure
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
