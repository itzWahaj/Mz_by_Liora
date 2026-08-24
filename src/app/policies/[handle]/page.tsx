import Prose from "@/components/prose";
import { getPolicy } from "@/lib/shopify";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: { handle: string };
}): Promise<Metadata> {
  const policy = await getPolicy(params.handle);

  if (!policy) notFound();

  const title = policy.title;
  const description = `${policy.title} and store guidelines for MZ by LIORA.`;
  const canonicalUrl = `/policies/${policy.handle}`;

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
      type: "article",
    },
  };
}

export default async function PolicyPage({
  params,
}: {
  params: { handle: string };
}) {
  const policy = await getPolicy(params.handle);

  if (!policy) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <h1 className="mb-8 font-display text-4xl font-bold tracking-tight md:text-5xl">
        {policy.title}
      </h1>
      <Prose className="mb-8" html={policy.body} />
    </div>
  );
}
