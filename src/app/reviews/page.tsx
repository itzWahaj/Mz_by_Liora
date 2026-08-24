import { Metadata } from "next";
import { getAllJudgeMeReviews } from "@/lib/judgeme";
import AllReviewsClient from "@/components/reviews/all-reviews-client";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Customer Reviews & Verified Results | MZ by LIORA";
  const description =
    "Read genuine customer reviews, routine feedback, and verified skincare results from real MZ by LIORA daily rituals across Pakistan.";
  const canonicalUrl = "/reviews";

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
    },
  };
}

export default async function ReviewsPage() {
  const { reviews, products, stats } = await getAllJudgeMeReviews({
    page: 1,
    perPage: 100,
  });

  return (
    <AllReviewsClient
      initialReviews={reviews}
      products={products}
      stats={stats}
    />
  );
}
