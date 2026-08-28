import LogoSquare from "@/components/logo-square";
import FooterNewsletter from "@/components/layout/footer-newsletter";
import { BRAND } from "@/lib/constants";
import { getMenu } from "@/lib/shopify";
import Link from "next/link";

// ── Social Media Links ─────────────────────────────────────────────────────────
// Update these URLs to your actual profiles
const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/mzbyliora/",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61593537795732",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@mzbyliora",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z" />
      </svg>
    ),
  },
];

function FooterSectionHeading({ title }: { title: string }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4D581E] dark:text-neutral-200">
      {title}
    </h4>
  );
}

function FooterNavLink({ href, label }: { href: string; label: string }) {
  if (!href || href === "#") {
    return (
      <span className="font-sans text-sm text-[#303515]/80 dark:text-neutral-400">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      prefetch={true}
      className="group relative inline-flex items-center overflow-hidden rounded-full px-2.5 py-1 font-sans text-sm font-medium text-[#303515]/80 transition-brand hover:text-white dark:text-neutral-400 dark:hover:text-white"
    >
      <span
        aria-hidden
        className="absolute inset-0 origin-left scale-x-0 rounded-full bg-[#596522] opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100"
      />
      <span className="relative z-10">{label}</span>
    </Link>
  );
}

export default async function Footer() {
  const shopifyMenu = await getMenu("footer");
  const siteName = process.env.SITE_NAME || "MZ by LIORA";
  const year = new Date().getFullYear();

  // Extract nested columns from Shopify footer menu if present
  const shopifyNested = shopifyMenu.filter(
    (item) => (item.items?.length ?? 0) > 0
  );

  // Fallback links for Customer Care if Shopify menu is minimal
  const customerCareLinks = [
    { title: "Customer Reviews", href: "/reviews" },
    { title: "Shipping & Returns", href: "/policies/shipping-policy" },
    { title: "FAQ", href: "/faq" },
    { title: "Contact Us", href: "/contact" },
  ];

  // Fallback links for Legal if Shopify menu is minimal
  const legalLinks = [
    { title: "Privacy Policy", href: "/policies/privacy-policy" },
    { title: "Terms of Service", href: "/policies/terms-of-service" },
    { title: "Refund Policy", href: "/policies/refund-policy" },
    { title: "Shipping Policy", href: "/policies/shipping-policy" },
  ];

  const menuColumns =
    shopifyNested.length > 0
      ? shopifyNested
      : [
          {
            title: "Customer Care",
            items: customerCareLinks.map((l) => ({
              title: l.title,
              path: l.href,
            })),
          },
          {
            title: "Legal",
            items: legalLinks.map((l) => ({ title: l.title, path: l.href })),
          },
        ];

  return (
    <footer className="mt-auto">
      <div aria-hidden className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D8BB7A] to-transparent" />
      <div className="relative overflow-hidden bg-[#FAF9F4] dark:bg-black">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-brand-radial opacity-[0.08] dark:opacity-20"
        />
        <div className="relative mx-auto flex max-w-screen-2xl flex-col gap-12 px-4 py-12 md:px-8 lg:px-12">
          {/* Newsletter Section */}
          <FooterNewsletter />

          {/* Main Footer Content */}
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
            {/* Brand Column */}
            <div className="max-w-lg space-y-5">
              <Link
                href="/"
                className="group inline-flex items-center gap-3 transition-brand hover:opacity-90"
              >
                <span className="rounded-full transition-brand group-hover:ring-2 group-hover:ring-[#D8BB7A] group-hover:ring-offset-2 group-hover:ring-offset-[#FAF9F4] dark:group-hover:ring-offset-black">
                  <LogoSquare size="sm" />
                </span>
                <div>
                  <p className="font-display text-xl font-bold tracking-tight text-[#4D581E] transition-colors group-hover:text-[#596522] dark:text-white dark:group-hover:text-[#D8BB7A]">
                    {siteName}
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#C49A45] transition-colors group-hover:text-[#596522]">
                    {BRAND.tagline}
                  </p>
                </div>
              </Link>
              <p className="font-sans text-sm leading-relaxed text-[#303515]/80 dark:text-neutral-400">
                {BRAND.description}
              </p>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                {["Dermatologist Formulated", "Purity Guaranteed", "Cruelty-Free"].map(
                  (badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center rounded-full border border-[#D8BB7A]/60 bg-[#FFFDF8] px-3 py-1 text-xs font-medium text-[#4D581E] dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-[#D8BB7A]"
                    >
                      {badge}
                    </span>
                  )
                )}
              </div>

              {/* Social Media Links */}
              <div className="flex items-center gap-2 pt-1">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow us on ${social.label}`}
                    className="group flex h-9 w-9 items-center justify-center rounded-full border border-[#D8BB7A]/60 bg-[#FFFDF8] text-[#596522] shadow-xs transition-all duration-300 hover:border-[#596522] hover:bg-[#596522] hover:text-white hover:shadow-[0_8px_20px_rgba(89,101,34,0.25)] dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-[#D8BB7A] dark:hover:bg-[#596522] dark:hover:text-white"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Menu Columns - Customer Care & Legal */}
            <div className="grid flex-1 grid-cols-2 gap-8 sm:gap-16 lg:max-w-xl lg:justify-items-start">
              {menuColumns.map((col) => (
                <div key={col.title} className="space-y-4">
                  <FooterSectionHeading title={col.title} />
                  <ul className="space-y-2">
                    {col.items?.map((item) => (
                      <li key={item.title}>
                        <FooterNavLink
                          href={item.path || "#"}
                          label={item.title}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="relative border-t border-[#D8BB7A]/30 px-4 py-6 text-center text-xs text-[#303515]/70 dark:border-neutral-800 dark:text-neutral-400 md:px-8">
          <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-3 sm:flex-row">
            <p>© {year} {process.env.COMPANY_NAME || siteName}. All rights reserved.</p>
            <div className="flex items-center gap-4 text-[#303515]/60 dark:text-neutral-400">
              {/* Compact social icons in bottom bar */}
              <div className="flex items-center gap-2">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="text-[#303515]/50 transition-colors hover:text-[#596522] dark:text-neutral-500 dark:hover:text-[#D8BB7A]"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
              <span className="hidden sm:inline">Care Beyond Standards</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
