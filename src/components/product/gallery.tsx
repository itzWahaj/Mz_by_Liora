"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { GridTileImage } from "../grid/tile";
import { useProduct, useUpdateURL } from "./product-context";

export default function Gallery({
  images,
}: {
  images: { src: string; altText: string }[];
}) {
  const { state, updateImage } = useProduct();
  const updateURL = useUpdateURL();
  const reduceMotion = Boolean(useReducedMotion());

  const rawIndex = state.image ? parseInt(state.image, 10) : 0;
  const urlIndex =
    Number.isFinite(rawIndex) && rawIndex >= 0 && rawIndex < images.length
      ? rawIndex
      : 0;

  // Local index so arrow/thumb clicks update immediately (URL sync is secondary).
  const [imageIndex, setImageIndex] = useState(urlIndex);

  useEffect(() => {
    setImageIndex(urlIndex);
  }, [urlIndex]);

  const nextImageIndex = imageIndex + 1 < images.length ? imageIndex + 1 : 0;
  const previousImageIndex =
    imageIndex === 0 ? images.length - 1 : imageIndex - 1;

  function selectImage(index: number) {
    if (index === imageIndex || index < 0 || index >= images.length) return;
    setImageIndex(index);
    const newState = updateImage(index.toString());
    updateURL(newState);
  }

  if (!images.length) return null;

  return (
    <div>
      <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden rounded-2xl bg-neutral-50 dark:bg-neutral-950">
        <AnimatePresence initial={false}>
          <motion.div
            key={images[imageIndex]?.src ?? imageIndex}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.35,
              ease: "easeInOut",
            }}
            className="absolute inset-0"
          >
            <Image
              className="object-contain"
              fill
              sizes="(min-width: 1024px) 66vw, 100vw"
              src={images[imageIndex].src}
              alt={images[imageIndex].altText}
              priority={imageIndex === 0}
            />
          </motion.div>
        </AnimatePresence>

        {images.length > 1 ? (
          <div className="absolute bottom-[12%] z-10 flex w-full justify-center px-4">
            <div className="mx-auto flex h-11 items-center rounded-full border border-neutral-200/80 bg-white/95 text-neutral-600 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/95 dark:text-neutral-300">
              <button
                type="button"
                onClick={() => selectImage(previousImageIndex)}
                aria-label="Previous product image"
                className="flex h-full items-center justify-center px-5 transition-brand hover:text-brand-teal"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div className="mx-0.5 h-6 w-px bg-neutral-300 dark:bg-neutral-600" />
              <button
                type="button"
                onClick={() => selectImage(nextImageIndex)}
                aria-label="Next product image"
                className="flex h-full items-center justify-center px-5 transition-brand hover:text-brand-teal"
              >
                <ArrowRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {images.length > 1 ? (
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-2.5 pb-1 lg:mb-0">
          {images.map((image, index) => {
            const isActive = index === imageIndex;
            return (
              <li key={`${image.src}-${index}`} className="h-20 w-20 shrink-0">
                <button
                  type="button"
                  onClick={() => selectImage(index)}
                  aria-label={`Select product image ${index + 1}`}
                  aria-current={isActive ? "true" : undefined}
                  className="group/thumb relative h-full w-full rounded-xl p-[2px] transition-transform duration-200 active:scale-95"
                  style={{
                    backgroundImage: isActive
                      ? "linear-gradient(135deg, #1E5FBF 0%, #14B8A6 50%, #2DD4BF 100%)"
                      : "none",
                  }}
                >
                  {!isActive ? (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-xl bg-brand-gradient opacity-0 transition-opacity duration-300 group-hover/thumb:opacity-100"
                    />
                  ) : null}
                  <span className="relative block h-full w-full overflow-hidden rounded-[10px]">
                    <GridTileImage
                      alt={image.altText}
                      src={image.src}
                      active={isActive}
                      isInteractive={false}
                      width={80}
                      height={80}
                      className={
                        isActive
                          ? "opacity-100"
                          : "opacity-65 transition-opacity group-hover/thumb:opacity-100"
                      }
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
