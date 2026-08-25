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
    if (typeof window === "undefined") return;

    // Skip continuous infinite GSAP background repaints on mobile to free GPU for 120Hz smooth scrolling
    const isMobile =
      window.innerWidth < 768 ||
      window.matchMedia("(pointer: coarse)").matches;

    if (isMobile) return;

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
      className="relative z-0 w-full overflow-hidden border-b border-[#D8BB7A]/40 bg-[#FAF9F4] pt-8 md:pt-12 lg:pt-14 dark:border-neutral-800 dark:bg-black"
    >
      <div
        ref={ambientRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-10%] transform-gpu will-change-transform bg-brand-radial opacity-40 dark:opacity-20"
        style={{ backgroundSize: "160% 160%", backgroundPosition: "35% 50%" }}
      />
      <div
        ref={blobARef}
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-8 h-72 w-72 transform-gpu will-change-transform rounded-full bg-[#596522]/15 blur-3xl dark:bg-[#596522]/20"
      />
      <div
        ref={blobBRef}
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-24 h-80 w-80 transform-gpu will-change-transform rounded-full bg-[#D8BB7A]/25 blur-3xl dark:bg-[#D8BB7A]/15"
      />
      <div
        ref={blobCRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 transform-gpu will-change-transform rounded-full bg-[#C49A45]/15 blur-3xl dark:bg-[#C49A45]/20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(250,249,244,0.4),_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(0,0,0,0.4),_transparent_60%)]"
      />

      <div className="relative px-4 pb-10 md:px-6 md:pb-14 lg:pb-16">
        {/* No backdrop-blur on this card — it softens headline glyphs in Chromium. */}
        <div className="mx-auto grid max-w-[1300px] items-center gap-8 overflow-hidden rounded-[2rem] border border-[#D8BB7A]/60 bg-[#FFFDF8]/95 px-5 py-8 shadow-[0_24px_80px_rgba(48,53,21,0.06)] sm:min-h-[520px] sm:px-8 sm:py-10 md:min-h-[580px] md:grid-cols-2 md:gap-10 md:px-10 md:py-12 lg:min-h-[640px] dark:border-[#D8BB7A]/20 dark:bg-neutral-950/90 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="relative z-10 flex flex-col justify-center">
            <motion.p
              className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#C49A45]"
              initial={reduceMotion || !motionReady ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              MZ by LIORA
            </motion.p>
            <h1 className="font-display text-4xl font-bold tracking-tight text-[#4D581E] [text-rendering:geometricPrecision] sm:text-5xl md:text-5xl lg:text-6xl lg:leading-[1.05] dark:text-white">
              {title}
            </h1>
            <BrandDivider className="mt-6 max-w-[360px]" />
            <motion.p
              className="mt-6 max-w-[34rem] text-base leading-relaxed text-[#303515]/85 md:text-lg dark:text-neutral-300"
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
                className="group relative inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#596522] px-7 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(89,101,34,0.3)] transition-all duration-300 hover:bg-[#C49A45] hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(196,154,69,0.45)] active:scale-[0.98]"
              >
                <span>Shop All Products</span>
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              {/* Secondary Call to Action */}
              <Link
                href="/collections/best-sellers"
                prefetch={true}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#D8BB7A] bg-[#FFFDF8] px-6 text-sm font-semibold text-[#4D581E] shadow-xs transition-all duration-300 hover:border-[#C49A45] hover:bg-[#FAF9F4] hover:shadow-md active:scale-[0.98] dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-white dark:hover:bg-neutral-900"
              >
                <SparklesIcon className="h-4 w-4 text-[#C49A45]" />
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
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#303515]/60 dark:text-neutral-500">
                Explore:
              </span>
              {[
                { title: "Skin Care", href: "/collections/skin-care" },
                { title: "Hair Care", href: "/collections/hair-care" },
                { title: "New Arrivals", href: "/collections/new-arrivals" },
              ].map((cat) => (
                <Link
                  key={cat.title}
                  href={cat.href}
                  prefetch={true}
                  className="group relative overflow-hidden rounded-full border border-[#D8BB7A]/50 bg-[#FAF9F4] px-3.5 py-1 text-xs font-semibold text-[#303515] transition-all duration-300 hover:border-[#596522] hover:text-white dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300 dark:hover:text-white"
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 origin-left scale-x-0 rounded-full bg-[#596522] opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100"
                  />
                  <span className="relative z-10">{cat.title}</span>
                </Link>
              ))}
            </motion.div>

            {/* Trust / Quality Highlights */}
            <motion.div
              className="mt-6 flex flex-wrap items-center gap-4 text-xs text-[#303515]/70 dark:text-neutral-400"
              initial={reduceMotion || !motionReady ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: reduceMotion ? 0 : 0.5,
                delay: reduceMotion ? 0 : 0.7,
              }}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[#596522]" />
                100% Botanical Care
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C49A45]" />
                Dermatologically Minded
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D8BB7A]" />
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
              className="absolute inset-6 rounded-full bg-brand-gradient opacity-20 blur-3xl dark:opacity-30"
            />
            <div className="relative aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-[1.75rem] border border-[#D8BB7A]/60 shadow-[0_30px_80px_rgba(89,101,34,0.16)] dark:border-[#D8BB7A]/20">
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
              <div className="absolute inset-0 bg-gradient-to-t from-[#303515]/30 via-transparent to-white/10 dark:from-black/45" />

              {/* Floating Hero Badge */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-[#D8BB7A]/50 bg-[#FFFDF8]/90 p-3 shadow-lg backdrop-blur-md dark:border-[#D8BB7A]/20 dark:bg-black/75">
                <div>
                  <p className="text-xs font-semibold text-[#4D581E] dark:text-white">
                    Signature Botanical Rituals
                  </p>
                  <p className="text-[10px] text-[#303515]/75 dark:text-neutral-300">
                    Formulated for lasting glow & calm
                  </p>
                </div>
                <span className="rounded-full bg-[#596522]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#596522] dark:bg-[#C49A45]/25 dark:text-[#D8BB7A]">
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
