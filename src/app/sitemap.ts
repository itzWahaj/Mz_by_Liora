export const runtime = "edge";

import { getCollections, getPages, getProducts } from "@/lib/shopify";
import { getSiteUrl } from "@/lib/utils";
import { MetadataRoute } from "next";

const baseUrl = getSiteUrl();
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  const collectionsPromise = getCollections()
    .then((collections) =>
      collections
        .filter((c) => c.path && c.handle !== "hidden")
        .map((collection) => ({
          url: `${baseUrl}${collection.path}`,
          lastModified: collection.updatedAt || new Date().toISOString(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }))
    )
    .catch(() => []);

  const productsPromise = getProducts({})
    .then((products) =>
      products
        .filter((p) => p.handle)
        .map((product) => ({
          url: `${baseUrl}/product/${product.handle}`,
          lastModified: product.updatedAt || new Date().toISOString(),
          changeFrequency: "daily" as const,
          priority: 0.9,
        }))
    )
    .catch(() => []);

  const pagesPromise = getPages()
    .then((pages) =>
      pages
        .filter((p) => p.handle)
        .map((page) => ({
          url: `${baseUrl}/${page.handle}`,
          lastModified: page.updatedAt || new Date().toISOString(),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        }))
    )
    .catch(() => []);

  const [collectionRoutes, productRoutes, pageRoutes] = await Promise.all([
    collectionsPromise,
    productsPromise,
    pagesPromise,
  ]);

  return [...staticRoutes, ...collectionRoutes, ...productRoutes, ...pageRoutes];
}
