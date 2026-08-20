"use client";

import BrandDivider from "@/components/ui/brand-divider";
import GradientButton from "@/components/ui/gradient-button";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import Image from "next/image";
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
        className="pointer-events-none absolute inset-[-10%] bg-brand-radial opacity-35 dark:opacity-45"
        style={{ backgroundSize: "160% 160%", backgroundPosition: "35% 50%" }}
      />
      <div
        ref={blobARef}
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-brand-teal/30 blur-3xl dark:bg-brand-teal/25"
      />
      <div
        ref={blobBRef}
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-24 h-80 w-80 rounded-full bg-brand-blue/25 blur-3xl dark:bg-brand-blue/30"
      />
      <div
        ref={blobCRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-brand-coral/20 blur-3xl dark:bg-brand-coral/25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(250,250,249,0.35),_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(15,23,42,0.35),_transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-multiply dark:opacity-[0.06] dark:mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
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
            <motion.div
              className="mt-7 flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap"
              initial={reduceMotion || !motionReady ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduceMotion ? 0 : 0.5,
                delay: reduceMotion ? 0 : 0.52,
                ease: "easeOut",
              }}
            >
              {collections.slice(0, 3).map((collection) => (
                <GradientButton
                  key={collection.handle}
                  href={collection.href}
                  prefetch={false}
                  className="h-10 px-5 text-sm"
                >
                  Shop {collection.title}
                </GradientButton>
              ))}
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
            <div className="relative aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-[1.75rem] border border-white/80 shadow-[0_30px_80px_rgba(30,95,191,0.18)] dark:border-white/10">
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
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/25 via-transparent to-white/10 dark:from-black/40" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
