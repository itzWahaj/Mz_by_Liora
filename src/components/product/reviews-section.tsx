"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckBadgeIcon,
  PencilSquareIcon,
  XMarkIcon,
  ChatBubbleLeftEllipsisIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { StarIcon, StarsRow } from "./star-rating";
import {
  JudgeMeReview,
  submitJudgeMeReview,
} from "@/lib/judgeme";
import { ReviewSummary } from "@/lib/shopify/types";

interface ReviewsSectionProps {
  productId: string;
  productHandle: string;
  productTitle: string;
  initialReviews?: JudgeMeReview[];
  reviewSummary?: ReviewSummary;
}

export default function ReviewsSection({
  productId,
  productHandle,
  productTitle,
  initialReviews = [],
  reviewSummary,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<JudgeMeReview[]>(initialReviews);

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<number | "all">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
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

  // Compute stats: prioritize live reviews if available, else metafield summary
  const totalCount = reviews.length > 0
    ? reviews.length
    : reviewSummary?.reviewCount || 0;

  const averageRating = reviews.length > 0
    ? Number(
        (
          reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
        ).toFixed(1)
      )
    : reviewSummary?.rating || 0;

  // Star breakdown calculation
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.rating) === star).length;
    const percentage = totalCount > 0 && reviews.length > 0
      ? Math.round((count / reviews.length) * 100)
      : star === 5 && reviewSummary?.rating && reviewSummary.rating >= 4.5
        ? 85
        : star === 4 && reviewSummary?.rating && reviewSummary.rating >= 4.0
          ? 15
          : 0;
    return { star, count, percentage };
  });

  const filteredReviews = reviews.filter((review) => {
    if (activeFilter === "all") return true;
    return Math.round(review.rating) === activeFilter;
  });

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formBody.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    const res = await submitJudgeMeReview({
      productId,
      productHandle,
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

      // Optimistic addition for immediate client feedback
      const newReview: JudgeMeReview = {
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
      }, 2400);
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
    <section
      id="reviews"
      className="scroll-mt-24 border-t border-[#E5E2DA] py-16 dark:border-[#2A3241]"
    >
      <div className="mx-auto max-w-screen-2xl">
        {/* Section Header */}
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-teal">
              Customer Feedback
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight text-[#1E2A3A] sm:text-4xl dark:text-white">
              Verified Reviews
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 hover:shadow-[0_8px_20px_rgba(20,184,166,0.3)]"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Write a Review
          </button>
        </div>

        {/* Rating Summary Card */}
        <div className="relative mb-12 grid grid-cols-1 gap-8 overflow-hidden rounded-3xl border border-[#E5E2DA] bg-[#FBFAF7] p-6 shadow-sm sm:p-8 lg:grid-cols-12 dark:border-[#2A3241] dark:bg-[#12161F]">
          {/* Top 2px Gradient Accent */}
          <div className="absolute left-0 right-0 top-0 h-[2px] bg-brand-gradient" />

          {/* Left: Overall Score */}
          <div className="flex flex-col items-center justify-center text-center lg:col-span-4 lg:border-r lg:border-[#E5E2DA] lg:pr-8 dark:lg:border-[#2A3241]">
            <span className="font-display text-5xl font-bold tracking-tight text-[#1E2A3A] dark:text-white">
              {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
            </span>
            <div className="mt-2">
              <StarsRow rating={averageRating} sizeClass="h-5 w-5" />
            </div>
            <p className="mt-2 text-sm text-[#475569] dark:text-neutral-400">
              Based on {totalCount} {totalCount === 1 ? "review" : "reviews"}
            </p>
          </div>

          {/* Right: Star Breakdown Progress Bars */}
          <div className="space-y-2.5 lg:col-span-8 lg:pl-4">
            {ratingDistribution.map(({ star, count, percentage }) => (
              <div
                key={star}
                className="flex items-center gap-3 text-sm"
              >
                <button
                  type="button"
                  onClick={() =>
                    setActiveFilter(activeFilter === star ? "all" : star)
                  }
                  className={`flex w-16 shrink-0 items-center gap-1 font-medium transition-colors ${
                    activeFilter === star
                      ? "text-brand-teal"
                      : "text-[#475569] hover:text-[#1E2A3A] dark:text-neutral-400 dark:hover:text-white"
                  }`}
                >
                  <span>{star}</span>
                  <StarIcon fillPercent={100} sizeClass="h-3.5 w-3.5" />
                </button>

                <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[#E5E2DA]/70 dark:bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-brand-gradient transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-10 text-right text-xs text-neutral-500 dark:text-neutral-400">
                  {percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List or Empty State */}
        {reviews.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl border border-dashed border-[#E5E2DA] bg-[#FBFAF7]/60 p-12 text-center dark:border-[#2A3241] dark:bg-[#12161F]/40">
            <ChatBubbleLeftEllipsisIcon className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
            <h3 className="mt-4 font-display text-xl font-semibold text-[#1E2A3A] dark:text-white">
              No Reviews Yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#475569] dark:text-neutral-400">
              Be the first to share your ritual experience with {productTitle}.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand-teal/40 bg-white px-6 py-2.5 text-sm font-semibold text-brand-teal shadow-sm transition-all hover:bg-brand-teal hover:text-white dark:bg-neutral-900"
            >
              <PencilSquareIcon className="h-4 w-4" />
              Write the First Review
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filter tags if reviews exist */}
            {reviews.length > 3 && (
              <div className="flex flex-wrap items-center gap-2 pb-2">
                <span className="text-xs font-medium text-neutral-500">
                  Filter by:
                </span>
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    activeFilter === "all"
                      ? "bg-brand-teal text-white shadow-sm"
                      : "border border-[#E5E2DA] bg-[#FBFAF7] text-[#475569] hover:border-brand-teal/50 dark:border-[#2A3241] dark:bg-[#12161F] dark:text-neutral-400"
                  }`}
                >
                  All ({reviews.length})
                </button>
                {[5, 4, 3, 2, 1].map((s) => {
                  const count = reviews.filter(
                    (r) => Math.round(r.rating) === s
                  ).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setActiveFilter(s)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        activeFilter === s
                          ? "bg-brand-teal text-white shadow-sm"
                          : "border border-[#E5E2DA] bg-[#FBFAF7] text-[#475569] hover:border-brand-teal/50 dark:border-[#2A3241] dark:bg-[#12161F] dark:text-neutral-400"
                      }`}
                    >
                      {s} Stars ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Review Cards Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#E5E2DA] bg-[#FBFAF7] p-7 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-teal/40 hover:shadow-[0_12px_28px_rgba(30,95,191,0.08)] dark:border-[#2A3241] dark:bg-[#12161F] dark:hover:border-brand-teal/40 dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
                >
                  {/* 2px Gradient Top Border */}
                  <div className="absolute left-0 right-0 top-0 h-[2px] bg-brand-gradient" />

                  {/* Decorative Quotation Mark in Top-Left Corner */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-1 left-5 select-none font-display text-6xl leading-none text-transparent bg-clip-text bg-brand-gradient opacity-15 dark:opacity-25"
                  >
                    “
                  </span>

                  <div className="relative z-10">
                    {/* Card Header: Stars & Date */}
                    <div className="flex items-center justify-between gap-2">
                      <StarsRow rating={review.rating} sizeClass="h-4 w-4" />
                      <span className="text-xs font-medium text-neutral-400">
                        {formatDate(review.created_at)}
                      </span>
                    </div>

                    {/* Review Title: Serif Display Font in Charcoal-Navy */}
                    {review.title && (
                      <h4 className="mt-3 font-display text-lg font-bold tracking-tight text-[#1E2A3A] sm:text-xl dark:text-[#F8FAFC]">
                        {review.title}
                      </h4>
                    )}

                    {/* Review Body: Sans font, muted charcoal */}
                    <p className="mt-2.5 font-sans text-sm leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
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
                              className="group/img relative h-24 w-24 overflow-hidden rounded-2xl border-2 border-[#E5E2DA] bg-neutral-100 shadow-xs transition-all duration-200 hover:scale-105 hover:border-brand-teal hover:shadow-md sm:h-28 sm:w-28 dark:border-[#2A3241] dark:bg-neutral-900"
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

                  {/* Reviewer Meta & Verified Badge */}
                  <div className="relative z-10 mt-6 border-t border-[#E5E2DA] pt-4 dark:border-[#2A3241]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white shadow-sm ring-2 ring-[#E5E2DA] dark:ring-[#2A3241]">
                          {review.reviewer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#1E2A3A] dark:text-white">
                            {review.reviewer.name}
                          </p>
                          {review.verified &&
                          review.verified !== "nothing" &&
                          review.verified !== "unverified" && (
                            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[#14B8A6]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0F766E] dark:bg-[#14B8A6]/20 dark:text-[#2DD4BF]">
                              <CheckBadgeIcon className="h-3.5 w-3.5 text-[#14B8A6]" />
                              Verified Buyer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Merchant Reply if present */}
                    {review.reply && (
                      <div className="mt-3 rounded-2xl border border-[#E5E2DA]/80 bg-white/70 p-3 text-xs dark:border-[#2A3241] dark:bg-neutral-800/60">
                        <p className="font-semibold text-[#1E2A3A] dark:text-white">
                          MZ by LIORA Response:
                        </p>
                        <p className="mt-1 text-[#334155] dark:text-[#CBD5E1]">
                          {review.reply.body}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Write a Review Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#E5E2DA] bg-[#FBFAF7] p-6 shadow-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:p-7 dark:border-[#2A3241] dark:bg-[#12161F]"
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>

              <h3 className="font-display text-xl font-bold text-[#1E2A3A] sm:text-2xl dark:text-white">
                Review {productTitle}
              </h3>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Share your authentic ritual experience to help others in our community.
              </p>

              {submitStatus ? (
                <div
                  className={`mt-5 rounded-2xl p-6 text-center ${
                    submitStatus.success
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      Overall Rating *
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
                      <span className="ml-2 text-xs font-semibold text-[#C9A227]">
                        {formHoverRating || formRating} Star
                        {(formHoverRating || formRating) > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Name & Email */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="rev-name"
                        className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400"
                      >
                        Your Name *
                      </label>
                      <input
                        id="rev-name"
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Ayesha Khan"
                        className="mt-1 w-full rounded-xl border border-[#E5E2DA] bg-white px-3 py-2 text-sm text-[#1E2A3A] shadow-sm outline-none transition-brand focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="rev-email"
                        className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400"
                      >
                        Email Address *
                      </label>
                      <input
                        id="rev-email"
                        type="email"
                        required
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="mt-1 w-full rounded-xl border border-[#E5E2DA] bg-white px-3 py-2 text-sm text-[#1E2A3A] shadow-sm outline-none transition-brand focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Review Title */}
                  <div>
                    <label
                      htmlFor="rev-title"
                      className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400"
                    >
                      Review Headline (Optional)
                    </label>
                    <input
                      id="rev-title"
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Transformed my skin texture!"
                      className="mt-1 w-full rounded-xl border border-[#E5E2DA] bg-white px-3 py-2 text-sm text-[#1E2A3A] shadow-sm outline-none transition-brand focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>

                  {/* Review Body */}
                  <div>
                    <label
                      htmlFor="rev-body"
                      className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400"
                    >
                      Review Description *
                    </label>
                    <textarea
                      id="rev-body"
                      rows={3}
                      required
                      value={formBody}
                      onChange={(e) => setFormBody(e.target.value)}
                      placeholder="Write your honest thoughts about the formula, scent, and results..."
                      className="mt-1 w-full rounded-xl border border-[#E5E2DA] bg-white px-3 py-2 text-sm text-[#1E2A3A] shadow-sm outline-none transition-brand focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>

                  {/* Photo Upload Section */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      Attach Photos (Optional)
                    </label>
                    
                    <div className="mt-1.5 space-y-2">
                      {selectedImages.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedImages.map((imgData, idx) => (
                            <div
                              key={idx}
                              className="group relative h-16 w-16 overflow-hidden rounded-xl border-2 border-brand-teal/50 bg-neutral-100 shadow-xs dark:bg-neutral-800"
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
                            id="product-review-photo-upload"
                          />
                          <label
                            htmlFor="product-review-photo-upload"
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#E5E2DA] bg-neutral-50/80 px-3.5 py-2.5 text-xs font-medium text-neutral-600 transition-colors hover:border-brand-teal hover:bg-brand-teal/5 dark:border-neutral-700 dark:bg-neutral-800/40 dark:text-neutral-300 dark:hover:border-brand-teal"
                          >
                            <PhotoIcon className="h-4 w-4 text-brand-teal" />
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
                      className="w-full rounded-full bg-brand-gradient py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:brightness-110 disabled:opacity-60"
                    >
                      {isSubmitting ? "Submitting Review…" : "Submit Review"}
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
    </section>
  );
}
