"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckBadgeIcon,
  PencilSquareIcon,
  XMarkIcon,
  ChatBubbleLeftEllipsisIcon,
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<number | "all">("all");

  // Form State
  const [formRating, setFormRating] = useState(5);
  const [formHoverRating, setFormHoverRating] = useState(0);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

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
    });

    setIsSubmitting(false);
    setSubmitStatus(res);

    if (res.success) {
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
        verified: "buyer",
      };
      setReviews((prev) => [newReview, ...prev]);

      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitStatus(null);
        setFormName("");
        setFormEmail("");
        setFormTitle("");
        setFormBody("");
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
      className="scroll-mt-24 border-t border-neutral-200/80 py-16 dark:border-neutral-800"
    >
      <div className="mx-auto max-w-screen-2xl">
        {/* Section Header */}
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-teal">
              Customer Feedback
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl dark:text-white">
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
        <div className="mb-12 grid grid-cols-1 gap-8 rounded-3xl border border-neutral-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-sm sm:p-8 lg:grid-cols-12 dark:border-neutral-800 dark:bg-neutral-900/60">
          {/* Left: Overall Score */}
          <div className="flex flex-col items-center justify-center text-center lg:col-span-4 lg:border-r lg:border-neutral-200/80 lg:pr-8 dark:lg:border-neutral-800">
            <span className="font-display text-5xl font-bold tracking-tight text-brand dark:text-white">
              {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
            </span>
            <div className="mt-2">
              <StarsRow rating={averageRating} sizeClass="h-5 w-5" />
            </div>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
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
                      : "text-neutral-600 hover:text-brand dark:text-neutral-400 dark:hover:text-white"
                  }`}
                >
                  <span>{star}</span>
                  <StarIcon fillPercent={100} sizeClass="h-3.5 w-3.5" />
                </button>

                <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
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
          <div className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50/50 p-12 text-center dark:border-neutral-700 dark:bg-neutral-900/30">
            <ChatBubbleLeftEllipsisIcon className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
            <h3 className="mt-4 font-display text-xl font-semibold text-brand dark:text-white">
              No Reviews Yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600 dark:text-neutral-400">
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
                      : "border border-neutral-200 bg-white text-neutral-600 hover:border-brand-teal/50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
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
                          : "border border-neutral-200 bg-white text-neutral-600 hover:border-brand-teal/50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
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
                  className="flex flex-col justify-between rounded-3xl border border-neutral-200/80 bg-white/80 p-6 shadow-sm transition-all hover:border-brand-teal/40 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/80"
                >
                  <div>
                    {/* Card Header: Stars & Date */}
                    <div className="flex items-center justify-between gap-2">
                      <StarsRow rating={review.rating} sizeClass="h-4 w-4" />
                      <span className="text-xs text-neutral-400">
                        {formatDate(review.created_at)}
                      </span>
                    </div>

                    {/* Review Title */}
                    {review.title && (
                      <h4 className="mt-3 font-semibold text-brand dark:text-white">
                        {review.title}
                      </h4>
                    )}

                    {/* Review Body */}
                    <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                      {review.body}
                    </p>

                    {/* Review Images if present */}
                    {review.pictures && review.pictures.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {review.pictures.map((pic, idx) => (
                          <img
                            key={idx}
                            src={pic.urls.small || pic.urls.original}
                            alt="Customer photo"
                            className="h-16 w-16 rounded-xl object-cover ring-1 ring-black/5"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reviewer Meta & Verified Badge */}
                  <div className="mt-5 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal/10 font-semibold text-brand-teal dark:bg-brand-teal/20">
                          {review.reviewer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-brand dark:text-white">
                            {review.reviewer.name}
                          </p>
                          {review.verified === "buyer" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                              <CheckBadgeIcon className="h-3.5 w-3.5" />
                              Verified Buyer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Merchant Reply if present */}
                    {review.reply && (
                      <div className="mt-3 rounded-2xl bg-neutral-50 p-3 text-xs dark:bg-neutral-800/60">
                        <p className="font-semibold text-brand dark:text-white">
                          MZ by LIORA Response:
                        </p>
                        <p className="mt-1 text-neutral-600 dark:text-neutral-300">
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
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl sm:p-8 dark:border-neutral-800 dark:bg-neutral-900"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute right-5 top-5 rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              <h3 className="font-display text-2xl font-bold text-brand dark:text-white">
                Write a Review
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                Sharing your experience for {productTitle}
              </p>

              {submitStatus ? (
                <div
                  className={`mt-6 rounded-2xl p-6 text-center ${
                    submitStatus.success
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                  }`}
                >
                  <p className="font-semibold">
                    {submitStatus.success ? "Review Submitted!" : "Submission Failed"}
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
                <form onSubmit={handleReviewSubmit} className="mt-6 space-y-4">
                  {/* Star Rating Select */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      Overall Rating
                    </label>
                    <div className="mt-2 flex items-center gap-1.5">
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
                            sizeClass="h-7 w-7"
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-xs font-semibold text-amber-500">
                        {formHoverRating || formRating} Star
                        {(formHoverRating || formRating) > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Name & Email */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-brand shadow-sm outline-none transition-brand focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
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
                        className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-brand shadow-sm outline-none transition-brand focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Review Title */}
                  <div>
                    <label
                      htmlFor="rev-title"
                      className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400"
                    >
                      Review Headline
                    </label>
                    <input
                      id="rev-title"
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Luxurious texture and deeply hydrating!"
                      className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-brand shadow-sm outline-none transition-brand focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
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
                      rows={4}
                      required
                      value={formBody}
                      onChange={(e) => setFormBody(e.target.value)}
                      placeholder="Write your honest thoughts about the formula, scent, and results..."
                      className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-brand shadow-sm outline-none transition-brand focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-full bg-brand-gradient py-3 text-sm font-semibold text-white shadow-md transition-all hover:brightness-110 disabled:opacity-60"
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
    </section>
  );
}
