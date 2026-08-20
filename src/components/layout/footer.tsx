import LogoSquare from "@/components/logo-square";
import FooterNewsletter from "@/components/layout/footer-newsletter";
import { BRAND } from "@/lib/constants";
import { getMenu } from "@/lib/shopify";
import Link from "next/link";

function FooterSectionHeading({ title }: { title: string }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-800 dark:text-neutral-200">
      {title}
    </h4>
  );
}

function FooterNavLink({ href, label }: { href: string; label: string }) {
  if (!href || href === "#") {
    return (
      <span className="font-sans text-sm text-neutral-600 dark:text-neutral-400">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      prefetch={true}
      className="group relative inline-flex items-center overflow-hidden rounded-full px-2.5 py-1 font-sans text-sm font-medium text-neutral-600 transition-brand hover:text-white dark:text-neutral-400 dark:hover:text-white"
    >
      <span
        aria-hidden
        className="absolute inset-0 origin-left scale-x-0 rounded-full bg-brand-gradient opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100"
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
      <div aria-hidden className="h-[3px] w-full bg-brand-gradient" />
      <div className="relative overflow-hidden bg-[#F3F8F7] dark:bg-black">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-brand-radial opacity-[0.07] dark:opacity-20"
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
                <span className="rounded-full transition-brand group-hover:ring-2 group-hover:ring-brand-teal/35 group-hover:ring-offset-2 group-hover:ring-offset-[#F3F8F7] dark:group-hover:ring-offset-black">
                  <LogoSquare size="sm" />
                </span>
                <div>
                  <p className="font-display text-xl font-bold tracking-tight text-brand transition-colors group-hover:text-brand-blue-dark dark:text-white dark:group-hover:text-brand-teal-light">
                    {siteName}
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 transition-colors group-hover:text-brand-teal">
                    {BRAND.tagline}
                  </p>
                </div>
              </Link>
              <p className="font-sans text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {BRAND.description}
              </p>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                {["Dermatologist Formulated", "Purity Guaranteed", "Cruelty-Free"].map(
                  (badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center rounded-full border border-brand-teal/20 bg-white/70 px-3 py-1 text-xs font-medium text-brand-teal dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-brand-teal-light"
                    >
                      {badge}
                    </span>
                  )
                )}
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
        <div className="relative border-t border-brand-teal/15 px-4 py-6 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400 md:px-8">
          <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-3 sm:flex-row">
            <p>© {year} {process.env.COMPANY_NAME || siteName}. All rights reserved.</p>
            <div className="flex items-center gap-4 text-neutral-400">
              <span>Care Beyond Standards</span>
              <span>•</span>
              <Link href="/policies/privacy-policy" className="transition-colors hover:text-brand-teal">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/policies/terms-of-service" className="transition-colors hover:text-brand-teal">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
