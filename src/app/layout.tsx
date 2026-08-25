import "../../env";
import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import AnnouncementBar from "@/components/layout/announcement-bar";
import Footer from "@/components/layout/footer";
import WhatsAppButton from "@/components/whatsapp-button";
import ExitIntentModal from "@/components/modal/exit-intent-modal";
import MetaPixel from "@/components/analytics/meta-pixel";
import { CartProvider } from "@/components/cart/cart-context";
import { WishlistProvider } from "@/components/wishlist/wishlist-context";
import LenisProvider from "@/components/providers/lenis-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import SplashWrapper from "@/components/splash-wrapper";
import { cookies } from "next/headers";
import { getCart, getCollectionProducts, getProducts } from "@/lib/shopify";
import { BRAND } from "@/lib/constants";
import { getSiteUrl } from "@/lib/utils";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
});

const siteUrl = getSiteUrl();
const siteName = process.env.SITE_NAME;
const description = BRAND.metaDescription;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description,
  icons: {
    icon: [
      { url: "/favicon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-64.png", type: "image/png", sizes: "64x64" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon-192.png",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName,
    title: siteName,
    description,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    creator: process.env.TWITTER_CREATOR,
    site: process.env.TWITTER_SITE,
    title: siteName,
    description,
  },
};

const themeInitScript = `
(function(){
  try {
    var key = 'mz-theme';
    var stored = localStorage.getItem(key);
    var theme = stored === 'dark' || stored === 'light'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    root.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cartId = cookies().get("cartId")?.value;
  const cart = getCart(cartId);

  const bestsellers = await getCollectionProducts({
    collection: "best-sellers",
  }).catch(() => []);
  const fallbackProducts =
    bestsellers.length >= 3
      ? bestsellers
      : await getProducts({}).catch(() => []);
  const recommendedProducts = (
    bestsellers.length >= 3 ? bestsellers : fallbackProducts
  ).slice(0, 3);

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MZ by LIORA",
    url: siteUrl,
    logo: `${siteUrl}/favicon-192.png`,
    sameAs: ["https://wa.me/923170692214"],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MZ by LIORA",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const siteNavigationJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: [
      {
        "@type": "SiteNavigationElement",
        position: 1,
        name: "Shop All Products",
        description: "Browse botanical skincare, hair oils, soaps, and radiant care rituals",
        url: `${siteUrl}/search`,
      },
      {
        "@type": "SiteNavigationElement",
        position: 2,
        name: "Best Sellers",
        description: "Explore our most-loved and top-rated botanical skincare products",
        url: `${siteUrl}/collections/best-sellers`,
      },
      {
        "@type": "SiteNavigationElement",
        position: 3,
        name: "Customer Reviews",
        description: "Read verified reviews and real customer experiences",
        url: `${siteUrl}/reviews`,
      },
      {
        "@type": "SiteNavigationElement",
        position: 4,
        name: "Our Story",
        description: "Discover the pure botanical philosophy behind MZ by LIORA",
        url: `${siteUrl}/our-story`,
      },
      {
        "@type": "SiteNavigationElement",
        position: 5,
        name: "Contact Us",
        description: "Reach out to our customer care and product consultation team",
        url: `${siteUrl}/contact`,
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteNavigationJsonLd),
          }}
        />
      </head>
      <body className={`${inter.variable} ${display.variable} font-sans`}>
        <ThemeProvider>
          <SplashWrapper>
            <CartProvider cartPromise={cart}>
              <WishlistProvider>
                <LenisProvider>
                  <AnnouncementBar />
                  <Navbar />
                  {children}
                  <Footer />
                  <WhatsAppButton />
                  <ExitIntentModal products={recommendedProducts} />
                </LenisProvider>
              </WishlistProvider>
            </CartProvider>
          </SplashWrapper>
        </ThemeProvider>
        <MetaPixel />
        {process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY ? (
          <Script
            id="klaviyo-js"
            strategy="afterInteractive"
            src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY}`}
          />
        ) : null}
      </body>
    </html>
  );
}
