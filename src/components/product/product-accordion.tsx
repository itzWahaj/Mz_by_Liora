"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDownIcon,
  SparklesIcon,
  HeartIcon,
  ShieldCheckIcon,
  TruckIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

interface ProductAccordionProps {
  descriptionHtml?: string;
  description?: string;
}

interface AccordionSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  contentHtml?: string;
  contentLines?: string[];
  defaultOpen?: boolean;
}

function parseSections(
  html: string,
  plainText: string
): AccordionSection[] {
  const sections: AccordionSection[] = [];
  const text = plainText || "";

  // Regex patterns to identify standard sections
  const benefitsMatch = text.match(
    /(?:Key Benefits|Benefits|Why You'll Love It)[\s:]*([\s\S]*?)(?=(?:How to Use|Usage|Direction|Ingredients|Size|MZ by LIORA|$))/i
  );
  const howToUseMatch = text.match(
    /(?:How to Use|Usage|Directions|Application)[\s:]*([\s\S]*?)(?=(?:Key Benefits|Benefits|Ingredients|Size|MZ by LIORA|$))/i
  );
  const sizeMatch = text.match(
    /(?:Size|Volume|Weight)[\s:]*([\s\S]*?)(?=(?:Key Benefits|How to Use|Ingredients|MZ by LIORA|$))/i
  );

  // Extract main overview (text before Key Benefits or How to Use)
  let overviewText = text;
  if (benefitsMatch && benefitsMatch.index !== undefined && benefitsMatch.index > 0) {
    overviewText = text.substring(0, benefitsMatch.index).trim();
  } else if (howToUseMatch && howToUseMatch.index !== undefined && howToUseMatch.index > 0) {
    overviewText = text.substring(0, howToUseMatch.index).trim();
  }

  // 1. Description / Overview Section
  if (overviewText.trim()) {
    sections.push({
      id: "overview",
      title: "Product Overview",
      icon: InformationCircleIcon,
      contentLines: overviewText
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean),
      defaultOpen: true,
    });
  } else if (html) {
    sections.push({
      id: "overview",
      title: "Product Overview",
      icon: InformationCircleIcon,
      contentHtml: html,
      defaultOpen: true,
    });
  }

  // 2. Key Benefits Section
  if (benefitsMatch && benefitsMatch[1]?.trim()) {
    const rawLines = benefitsMatch[1]
      .split(/\n+|•|▪|-/)
      .map((s) => s.trim().replace(/^[-•*▪\s]+/, ""))
      .filter((s) => s.length > 2);

    if (rawLines.length > 0) {
      sections.push({
        id: "benefits",
        title: "Key Benefits",
        icon: SparklesIcon,
        contentLines: rawLines,
        defaultOpen: true,
      });
    }
  }

  // 3. How to Use Section
  if (howToUseMatch && howToUseMatch[1]?.trim()) {
    const lines = howToUseMatch[1]
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (lines.length > 0) {
      sections.push({
        id: "how-to-use",
        title: "How to Use & Ritual",
        icon: HeartIcon,
        contentLines: lines,
        defaultOpen: false,
      });
    }
  }

  // 4. Size & Details
  if (sizeMatch && sizeMatch[1]?.trim()) {
    sections.push({
      id: "size",
      title: "Size & Specifications",
      icon: ShieldCheckIcon,
      contentLines: [sizeMatch[1].trim()],
      defaultOpen: false,
    });
  }

  // If no structured sections could be extracted from plain text, use full HTML
  if (sections.length === 0 && html) {
    sections.push({
      id: "full-details",
      title: "Product Details",
      icon: InformationCircleIcon,
      contentHtml: html,
      defaultOpen: true,
    });
  }

  // 5. Standard Luxury Shipping & Authenticity Section
  sections.push({
    id: "shipping",
    title: "Shipping & Authenticity",
    icon: TruckIcon,
    contentLines: [
      "100% Genuine MZ by LIORA Botanical Formulation.",
      "Fast, nationwide delivery across Pakistan within 2–4 business days.",
      "Carefully packaged with tamper-proof seal for optimal freshness.",
    ],
    defaultOpen: false,
  });

  return sections;
}

export default function ProductAccordion({
  descriptionHtml = "",
  description = "",
}: ProductAccordionProps) {
  const sections = useMemo(
    () => parseSections(descriptionHtml, description),
    [descriptionHtml, description]
  );

  const [openSectionIds, setOpenSectionIds] = useState<string[]>(() => {
    return sections.filter((s) => s.defaultOpen).map((s) => s.id);
  });

  const toggleSection = (id: string) => {
    setOpenSectionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (!descriptionHtml && !description) return null;

  return (
    <div className="mt-8 divide-y divide-[#D8BB7A]/30 rounded-2xl border border-[#D8BB7A]/60 bg-[#FFFDF8] p-1 shadow-sm backdrop-blur-xs dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900/40">
      {sections.map((section) => {
        const isOpen = openSectionIds.includes(section.id);
        const Icon = section.icon;

        return (
          <div key={section.id} className="overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-semibold text-[#4D581E] transition-colors hover:text-[#596522] dark:text-white dark:hover:text-[#D8BB7A]"
            >
              <span className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#596522]/10 text-[#596522] dark:bg-[#C49A45]/20 dark:text-[#D8BB7A]">
                  <Icon className="h-4 w-4" />
                </span>
                <span>{section.title}</span>
              </span>
              <ChevronDownIcon
                className={clsx(
                  "h-4 w-4 text-[#303515]/50 transition-transform duration-300",
                  isOpen && "rotate-180 text-[#596522]"
                )}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="px-4 pb-4 pt-1 text-xs leading-relaxed text-[#303515]/85 dark:text-neutral-300">
                    {section.contentHtml ? (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4"
                        dangerouslySetInnerHTML={{
                          __html: section.contentHtml,
                        }}
                      />
                    ) : section.contentLines && section.contentLines.length > 0 ? (
                      <ul className="space-y-2">
                        {section.contentLines.map((line, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#596522]" />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
