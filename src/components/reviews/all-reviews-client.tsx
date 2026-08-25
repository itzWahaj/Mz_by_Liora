"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckBadgeIcon,
  PencilSquareIcon,
  XMarkIcon,
  SparklesIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  FunnelIcon,
  ChevronDownIcon,
  CheckIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import LogoSquare from "@/components/logo-square";
import { StarIcon, StarsRow } from "@/components/product/star-rating";
import {
  EnrichedJudgeMeReview,
  JudgeMeProduct,
  submitJudgeMeReview,
} from "@/lib/judgeme";

interface AllReviewsClientProps {
  initialReviews: EnrichedJudgeMeReview[];
  products: JudgeMeProduct[];
  stats: {
    totalCount: number;
    averageRating: number;
    productReviewCount: number;
    storeReviewCount: number;
  };
}

export default function AllReviewsClient({
  initialReviews,
  products,
  stats,
}: AllReviewsClientProps) {
  const [reviews, setReviews] = useState<EnrichedJudgeMeReview[]>(initialReviews);
  const [activeTab, setActiveTab] = useState<"all" | "products" | "store">("all");
  const [selectedProductHandle, setSelectedProductHandle] = useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if initialReviews updates
  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  // Close custom dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Form State (Dedicated Store & Delivery Experience Review)
  const [formRating, setFormRating] = useState(5);
  const [formHoverRating, setFormHoverRating] = useState(0);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) return false;
      if (file.size > 5 * 1024 * 1024) {
        alert(`"${file.name}" is larger than 5MB.`);
        return false;
      }
      return true;
    });

    const availableSlots = 3 - selectedImages.length;
    const filesToProcess = validFiles.slice(0, availableSlots);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setSelectedImages((prev) =>
            prev.length < 3 ? [...prev, reader.result as string] : prev
          );
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Filter logic
  const filteredReviews = reviews.filter((r) => {
    // 1. Tab filter
    if (activeTab === "products" && r.is_shop_review) return false;
    if (activeTab === "store" && !r.is_shop_review) return false;

    // 2. Product dropdown filter
    if (
      selectedProductHandle !== "all" &&
      r.product_handle !== selectedProductHandle
    ) {
      return false;
    }

    return true;
  });

  const totalReviewsCount = reviews.length;
  const productReviewsCount = reviews.filter((r) => !r.is_shop_review).length;
  const storeReviewsCount = reviews.filter((r) => r.is_shop_review).length;

  const avgRating =
    totalReviewsCount > 0
      ? Number(
          (
            reviews.reduce((acc, curr) => acc + curr.rating, 0) /
            totalReviewsCount
          ).toFixed(1)
        )
      : stats.averageRating || 4.9;

  // Star breakdown calculation
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.rating) === star).length;
    const percentage =
      totalReviewsCount > 0
        ? Math.round((count / totalReviewsCount) * 100)
        : star === 5
        ? 90
        : star === 4
        ? 10
        : 0;
    return { star, count, percentage };
  });

  const selectedProductLabel =
    selectedProductHandle === "all"
      ? "All Products"
      : products.find((p) => p.handle === selectedProductHandle)?.title ||
        "All Products";

  // Dedicated Store Review Submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formBody.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    const res = await submitJudgeMeReview({
      name: formName.trim(),
      email: formEmail.trim(),
      rating: formRating,
      title: formTitle.trim(),
      body: formBody.trim(),
      pictures: selectedImages,
    });

    setIsSubmitting(false);
    setSubmitStatus(res);

    if (res.success) {
      const picturesArray =
        res.uploadedPictures && res.uploadedPictures.length > 0
          ? res.uploadedPictures
          : selectedImages.map((img) => ({
              urls: { small: img, original: img },
            }));

      const newReview: EnrichedJudgeMeReview = {
        id: Date.now(),
        title: formTitle.trim() || null,
        body: formBody.trim(),
        rating: formRating,
        reviewer: {
          name: formName.trim(),
          email: formEmail.trim(),
        },
        created_at: new Date().toISOString(),
        verified: "confirmed-buyer",
        is_shop_review: true,
        product_title: "MZ by LIORA Store & Delivery",
        pictures: picturesArray,
      };
      setReviews((prev) => [newReview, ...prev]);

      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitStatus(null);
        setFormName("");
        setFormEmail("");
        setFormTitle("");
        setFormBody("");
        setSelectedImages([]);
      }, 2200);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen pb-24 pt-8 md:pt-12">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        {/* Header Hero Banner */}
        <div className="relative mb-12 overflow-hidden rounded-3xl border border-[#D8BB7A]/60 bg-[#FFFDF8] p-8 shadow-sm sm:p-12 dark:border-neutral-800 dark:bg-[#12161F]">
          {/* Top 2px Gradient Accent Line */}
          <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-[#D8BB7A] via-[#C49A45] to-transparent" />

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            {/* Left: Headline & Trust Pillars */}
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#596522]/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#596522] dark:bg-[#C49A45]/20 dark:text-[#D8BB7A]">
                <SparklesIcon className="h-3.5 w-3.5" />
                Verified Customer Experiences
              </span>
              <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-[#4D581E] sm:text-5xl lg:text-6xl dark:text-white">
                Real Care. <br />
                <span className="bg-gradient-to-r from-[#596522] to-[#C49A45] bg-clip-text text-transparent">
                  Real Rituals.
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[#303515]/80 sm:text-lg dark:text-neutral-300">
                Explore authentic feedback from customers across Pakistan who have
                made MZ by LIORA a staple in their daily botanical skincare routine.
              </p>

              {/* Trust Badges */}
              <div className="mt-8 flex flex-wrap items-center gap-6 text-xs font-medium text-[#4D581E] dark:text-neutral-300">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-[#596522]" />
                  <span>100% Genuine Reviews</span>
                </div>
                <div className="flex items-center gap-2">
                  <TruckIcon className="h-4 w-4 text-[#596522]" />
                  <span>Fast Nationwide Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-4 w-4 text-[#596522]" />
                  <span>Botanical Formulas</span>
                </div>
              </div>
            </div>

            {/* Right: Score Card & Write Review CTA */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#D8BB7A]/60 bg-[#FAF9F4] p-8 text-center shadow-sm lg:col-span-5 dark:border-neutral-800 dark:bg-neutral-900/80">
              <span className="font-display text-6xl font-bold tracking-tight text-[#4D581E] dark:text-white">
                {avgRating > 0 ? avgRating.toFixed(1) : "5.0"}
              </span>
              <div className="mt-2">
                <StarsRow rating={avgRating} sizeClass="h-6 w-6" />
              </div>
              <p className="mt-2 text-sm font-medium text-[#303515]/75 dark:text-neutral-400">
                Overall rating based on {totalReviewsCount}{" "}
                {totalReviewsCount === 1 ? "review" : "reviews"}
              </p>

              {/* Mini Breakdown */}
              <div className="mt-5 w-full space-y-1.5 border-t border-[#D8BB7A]/40 pt-4 dark:border-neutral-800">
                {ratingDistribution.slice(0, 3).map(({ star, percentage }) => (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-8 text-left font-medium text-[#303515]/80 dark:text-neutral-400">
                      {star}★
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#FFFDF8] ring-1 ring-[#D8BB7A]/30 dark:bg-neutral-800">
                      <div
                        className="h-full rounded-full bg-[#596522]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-[#303515]/60">
                      {percentage}%
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#596522] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#C49A45] hover:shadow-[0_8px_20px_rgba(196,154,69,0.3)]"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Write a Store Review
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Controls */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#D8BB7A]/40 pb-6 md:flex-row md:items-center dark:border-neutral-800">
          {/* Main Segmented Tabs */}
          <div className="inline-flex rounded-2xl border border-[#D8BB7A]/60 bg-[#FAF9F4] p-1.5 shadow-sm dark:border-neutral-800 dark:bg-[#12161F]">
            <button
              type="button"
              onClick={() => {
                setActiveTab("all");
                setSelectedProductHandle("all");
              }}
              className={`group relative overflow-hidden rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-300 sm:text-sm ${
                activeTab === "all"
                  ? "bg-[#596522] text-white shadow-sm"
                  : "text-[#303515]/80 hover:text-white dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              {activeTab !== "all" && (
                <span
                  aria-hidden
                  className="absolute inset-0 origin-left scale-x-0 rounded-xl bg-[#596522] opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100"
                />
              )}
              <span className="relative z-10">All Reviews ({totalReviewsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className={`group relative overflow-hidden rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-300 sm:text-sm ${
                activeTab === "products"
                  ? "bg-[#596522] text-white shadow-sm"
                  : "text-[#303515]/80 hover:text-white dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              {activeTab !== "products" && (
                <span
                  aria-hidden
                  className="absolute inset-0 origin-left scale-x-0 rounded-xl bg-[#596522] opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100"
                />
              )}
              <span className="relative z-10">Product Reviews ({productReviewsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("store");
                setSelectedProductHandle("all");
              }}
              className={`group relative overflow-hidden rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-300 sm:text-sm ${
                activeTab === "store"
                  ? "bg-[#596522] text-white shadow-sm"
                  : "text-[#303515]/80 hover:text-white dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              {activeTab !== "store" && (
                <span
                  aria-hidden
                  className="absolute inset-0 origin-left scale-x-0 rounded-xl bg-[#596522] opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100"
                />
              )}
              <span className="relative z-10">Store & Delivery ({storeReviewsCount})</span>
            </button>
          </div>

          {/* Styled Theme Dropdown for Active Products */}
          {activeTab !== "store" && products.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="group inline-flex items-center gap-2 rounded-2xl border border-[#D8BB7A]/60 bg-[#FFFDF8] px-4 py-2.5 text-xs font-semibold text-[#303515] shadow-sm transition-all hover:border-[#C49A45] hover:shadow-md dark:border-neutral-800 dark:bg-[#12161F] dark:text-white"
              >
                <FunnelIcon className="h-4 w-4 text-[#596522]" />
                <span>{selectedProductLabel}</span>
                <ChevronDownIcon
                  className={`h-3.5 w-3.5 text-[#303515]/60 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180 text-[#596522]" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-[#D8BB7A] bg-[#FFFDF8] p-2 shadow-2xl dark:border-neutral-800 dark:bg-[#12161F]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProductHandle("all");
                        setIsDropdownOpen(false);
                      }}
                      className={`group relative flex w-full items-center justify-between overflow-hidden rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-300 ${
                        selectedProductHandle === "all"
                          ? "bg-[#596522] text-white shadow-sm"
                          : "text-[#303515]/80 hover:text-white dark:text-neutral-300 dark:hover:text-white"
                      }`}
                    >
                      {selectedProductHandle !== "all" && (
                        <span
                          aria-hidden
                          className="absolute inset-0 origin-left scale-x-0 rounded-xl bg-[#596522] opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100"
                        />
                      )}
                      <span className="relative z-10">All Products</span>
                      {selectedProductHandle === "all" && (
                        <CheckIcon className="relative z-10 h-3.5 w-3.5" />
                      )}
                    </button>

                    <div className="my-1 border-t border-[#D8BB7A]/30 dark:border-neutral-800" />

                    {products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProductHandle(p.handle);
                          setIsDropdownOpen(false);
                        }}
                        className={`group relative flex w-full items-center justify-between overflow-hidden rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all duration-300 ${
                          selectedProductHandle === p.handle
                            ? "bg-[#596522] text-white shadow-sm"
                            : "text-[#303515]/80 hover:text-white dark:text-neutral-300 dark:hover:text-white"
                        }`}
                      >
                        {selectedProductHandle !== p.handle && (
                          <span
                            aria-hidden
                            className="absolute inset-0 origin-left scale-x-0 rounded-xl bg-[#596522] opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100"
                          />
                        )}
                        <span className="relative z-10 truncate pr-2">{p.title}</span>
                        {selectedProductHandle === p.handle && (
                          <CheckIcon className="relative z-10 h-3.5 w-3.5 shrink-0" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Reviews Cards Grid */}
        {filteredReviews.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl border border-dashed border-[#D8BB7A]/60 bg-[#FFFDF8]/60 p-16 text-center dark:border-neutral-800 dark:bg-[#12161F]/40">
            <h3 className="font-display text-2xl font-bold text-[#4D581E] dark:text-white">
              No matching reviews found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#303515]/75 dark:text-neutral-400">
              Try selecting a different category or viewing all products.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveTab("all");
                setSelectedProductHandle("all");
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#D8BB7A] bg-[#FFFDF8] px-6 py-2.5 text-sm font-semibold text-[#596522] shadow-sm transition-all hover:bg-[#596522] hover:text-white dark:bg-neutral-900"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#D8BB7A]/60 bg-[#FFFDF8] p-7 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#C49A45] hover:shadow-[0_12px_28px_rgba(89,101,34,0.08)] dark:border-neutral-800 dark:bg-[#12161F] dark:hover:border-[#D8BB7A]"
              >
                {/* 2px Gradient Top Accent */}
                <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-[#D8BB7A] via-[#C49A45] to-transparent" />

                {/* Decorative Quotation Mark in Top-Left Corner */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-1 left-5 select-none font-display text-6xl leading-none text-transparent bg-clip-text bg-gradient-to-br from-[#596522] to-[#D8BB7A] opacity-15 dark:opacity-25"
                >
                  “
                </span>

                <div className="relative z-10">
                  {/* TOP HEADER: Product Image + Product Name + Link OR Store Brand Info */}
                  {review.is_shop_review ? (
                    <div className="flex items-center justify-between gap-3 border-b border-[#D8BB7A]/30 pb-3.5 dark:border-neutral-800">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#596522] p-1 shadow-sm">
                          <LogoSquare size="sm" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#4D581E] dark:text-white">
                            MZ by LIORA
                          </p>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C49A45]">
                            <TruckIcon className="h-3 w-3 text-[#596522]" />
                            Store & Delivery
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-[#303515]/60">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 border-b border-[#D8BB7A]/30 pb-3.5 dark:border-neutral-800">
                      <Link
                        href={`/product/${review.product_handle}`}
                        className="group/prod flex min-w-0 items-center gap-2.5 transition-colors"
                      >
                        {review.product_image_url ? (
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[#D8BB7A]/50 bg-white shadow-xs dark:border-neutral-700 dark:bg-neutral-800">
                            <Image
                              src={review.product_image_url}
                              alt={review.product_title || "Product image"}
                              fill
                              sizes="40px"
                              className="object-cover transition-transform group-hover/prod:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#596522]/10 text-[#596522]">
                            <SparklesIcon className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-[#4D581E] transition-colors group-hover/prod:text-[#596522] dark:text-white dark:group-hover/prod:text-[#D8BB7A]">
                            {review.product_title || "Product Review"}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#596522]">
                            <span>View Product</span>
                            <ArrowRightIcon className="h-2.5 w-2.5 transition-transform group-hover/prod:translate-x-0.5" />
                          </span>
                        </div>
                      </Link>
                      <span className="shrink-0 text-[11px] font-medium text-[#303515]/60">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                  )}

                  {/* Rating Stars */}
                  <div className="mt-3.5 flex items-center justify-between">
                    <StarsRow rating={review.rating} sizeClass="h-4 w-4" />
                  </div>

                  {/* Headline: Serif Display Font */}
                  {review.title && (
                    <h4 className="mt-2.5 font-display text-lg font-bold tracking-tight text-[#4D581E] sm:text-xl dark:text-[#F8FAFC]">
                      {review.title}
                    </h4>
                  )}

                  {/* Body Text */}
                  <p className="mt-2 font-sans text-sm leading-relaxed text-[#303515]/85 dark:text-[#CBD5E1]">
                    {review.body}
                  </p>

                  {/* Review Images if present */}
                  {review.pictures && review.pictures.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      {review.pictures.map((pic, idx) => {
                        const imgUrl =
                          pic.urls?.small ||
                          pic.urls?.original ||
                          (typeof pic === "string" ? pic : "");
                        const fullUrl =
                          pic.urls?.original || pic.urls?.small || imgUrl;
                        if (!imgUrl) return null;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setLightboxImage(fullUrl)}
                            className="group/img relative h-24 w-24 overflow-hidden rounded-2xl border-2 border-[#D8BB7A]/60 bg-[#FAF9F4] shadow-xs transition-all duration-200 hover:scale-105 hover:border-[#C49A45] hover:shadow-md sm:h-28 sm:w-28 dark:border-neutral-700 dark:bg-neutral-900"
                            title="Click to view full photo"
                          >
                            <img
                              src={imgUrl}
                              alt="Customer review photo"
                              className="h-full w-full object-cover transition-transform duration-300 group-hover/img:scale-110"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover/img:bg-black/25 group-hover/img:opacity-100">
                              <span className="rounded-full bg-black/60 p-1.5 text-white backdrop-blur-xs">
                                <PhotoIcon className="h-4 w-4" />
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer: Reviewer Info & Verified Badge */}
                <div className="relative z-10 mt-6 border-t border-[#D8BB7A]/30 pt-4 dark:border-neutral-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#596522] text-xs font-bold text-white shadow-sm ring-2 ring-[#D8BB7A]/40 dark:ring-neutral-700">
                        {review.reviewer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#4D581E] dark:text-white">
                          {review.reviewer.name}
                        </p>
                        {review.verified &&
                        review.verified !== "nothing" &&
                        review.verified !== "unverified" && (
                          <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[#596522]/10 px-2 py-0.5 text-[10px] font-semibold text-[#596522] dark:bg-[#C49A45]/20 dark:text-[#D8BB7A]">
                            <CheckBadgeIcon className="h-3.5 w-3.5 text-[#596522]" />
                            Verified Buyer
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Merchant Reply if present */}
                  {review.reply && (
                    <div className="mt-3 rounded-2xl border border-[#D8BB7A]/40 bg-[#FAF9F4] p-3 text-xs dark:border-neutral-800 dark:bg-neutral-800/60">
                      <p className="font-semibold text-[#4D581E] dark:text-white">
                        MZ by LIORA Response:
                      </p>
                      <p className="mt-1 text-[#303515]/80 dark:text-[#CBD5E1]">
                        {review.reply.body}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Write Store Review Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#D8BB7A]/60 bg-[#FFFDF8] p-6 shadow-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:p-7 dark:border-neutral-800 dark:bg-[#12161F]"
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#596522] p-1 text-white shadow-xs">
                  <LogoSquare size="sm" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-[#4D581E] sm:text-2xl dark:text-white">
                    Store & Delivery Experience
                  </h3>
                </div>
              </div>
              <p className="mt-1 text-xs text-[#303515]/70 dark:text-neutral-400">
                Share your feedback regarding our delivery speed, packaging, customer care, and overall shopping experience.
              </p>

              {submitStatus ? (
                <div
                  className={`mt-5 rounded-2xl p-6 text-center ${
                    submitStatus.success
                      ? "bg-[#596522]/10 text-[#4D581E] dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                  }`}
                >
                  <p className="font-semibold">
                    {submitStatus.success
                      ? "Review Submitted!"
                      : "Submission Failed"}
                  </p>
                  <p className="mt-1 text-sm">{submitStatus.message}</p>
                  {!submitStatus.success && (
                    <button
                      type="button"
                      onClick={() => setSubmitStatus(null)}
                      className="mt-3 rounded-full bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="mt-5 space-y-3.5">
                  {/* Star Rating Select */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#303515]/75 dark:text-neutral-400">
                      Overall Experience Rating *
                    </label>
                    <div className="mt-1.5 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setFormHoverRating(star)}
                          onMouseLeave={() => setFormHoverRating(0)}
                          onClick={() => setFormRating(star)}
                          className="p-1 transition-transform hover:scale-110 focus:outline-none"
                        >
                          <StarIcon
                            fillPercent={
                              (formHoverRating || formRating) >= star ? 100 : 0
                            }
                            sizeClass="h-6 w-6"
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-xs font-semibold text-[#C49A45]">
                        {formHoverRating || formRating} Star
                        {(formHoverRating || formRating) > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Name & Email */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="store-rev-name"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#303515]/75 dark:text-neutral-400"
                      >
                        Your Name *
                      </label>
                      <input
                        id="store-rev-name"
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Ayesha Khan"
                        className="mt-1 w-full rounded-xl border border-[#D8BB7A]/60 bg-white px-3 py-2 text-sm text-[#303515] shadow-sm outline-none transition-brand focus:border-[#C49A45] focus:ring-2 focus:ring-[#C49A45]/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="store-rev-email"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#303515]/75 dark:text-neutral-400"
                      >
                        Email Address *
                      </label>
                      <input
                        id="store-rev-email"
                        type="email"
                        required
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="mt-1 w-full rounded-xl border border-[#D8BB7A]/60 bg-white px-3 py-2 text-sm text-[#303515] shadow-sm outline-none transition-brand focus:border-[#C49A45] focus:ring-2 focus:ring-[#C49A45]/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Review Title */}
                  <div>
                    <label
                      htmlFor="store-rev-title"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#303515]/75 dark:text-neutral-400"
                    >
                      Headline (Optional)
                    </label>
                    <input
                      id="store-rev-title"
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Fast delivery & wonderful packaging!"
                      className="mt-1 w-full rounded-xl border border-[#D8BB7A]/60 bg-white px-3 py-2 text-sm text-[#303515] shadow-sm outline-none transition-brand focus:border-[#C49A45] focus:ring-2 focus:ring-[#C49A45]/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>

                  {/* Review Body */}
                  <div>
                    <label
                      htmlFor="store-rev-body"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#303515]/75 dark:text-neutral-400"
                    >
                      Your Feedback *
                    </label>
                    <textarea
                      id="store-rev-body"
                      rows={3}
                      required
                      value={formBody}
                      onChange={(e) => setFormBody(e.target.value)}
                      placeholder="Write about the order delivery time, packaging care, or customer support..."
                      className="mt-1 w-full rounded-xl border border-[#D8BB7A]/60 bg-white px-3 py-2 text-sm text-[#303515] shadow-sm outline-none transition-brand focus:border-[#C49A45] focus:ring-2 focus:ring-[#C49A45]/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>

                  {/* Photo Upload Section */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#303515]/75 dark:text-neutral-400">
                      Attach Photos (Optional)
                    </label>
                    
                    <div className="mt-1.5 space-y-2">
                      {selectedImages.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedImages.map((imgData, idx) => (
                            <div
                              key={idx}
                              className="group relative h-16 w-16 overflow-hidden rounded-xl border-2 border-[#596522]/50 bg-[#FAF9F4] shadow-xs dark:bg-neutral-800"
                            >
                              <img
                                src={imgData}
                                alt={`Upload preview ${idx + 1}`}
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white transition-transform hover:scale-110 hover:bg-rose-600"
                                aria-label="Remove image"
                              >
                                <XMarkIcon className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedImages.length < 3 && (
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                            id="store-review-photo-upload"
                          />
                          <label
                            htmlFor="store-review-photo-upload"
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#D8BB7A]/60 bg-[#FAF9F4] px-3.5 py-2.5 text-xs font-medium text-[#303515]/80 transition-colors hover:border-[#C49A45] hover:bg-[#C49A45]/10 dark:border-neutral-700 dark:bg-neutral-800/40 dark:text-neutral-300 dark:hover:border-[#D8BB7A]"
                          >
                            <PhotoIcon className="h-4 w-4 text-[#596522]" />
                            <span>Add Photos (up to 3, max 5MB each)</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-full bg-[#596522] py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#C49A45] hover:shadow-[0_8px_20px_rgba(196,154,69,0.35)] disabled:opacity-60"
                    >
                      {isSubmitting ? "Submitting Review…" : "Submit Store Review"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Screen Image Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxImage(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-10 flex max-h-[88vh] max-w-[92vw] flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-sm"
            >
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-md transition-all hover:scale-110 hover:bg-rose-600 focus:outline-none"
                aria-label="Close image"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <img
                src={lightboxImage}
                alt="Enlarged customer review photo"
                className="max-h-[82vh] max-w-[88vw] rounded-2xl object-contain shadow-2xl"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
