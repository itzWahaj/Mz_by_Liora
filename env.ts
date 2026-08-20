import { z } from "zod";

const envSchema = z.object({
  COMPANY_NAME: z.string().min(1),
  TWITTER_CREATOR: z.string().min(1),
  TWITTER_SITE: z.string().min(1),
  SITE_NAME: z.string().min(1),
  SITE_URL: z.string().url(),
  SHOPIFY_REVALIDATION_SECRET: z.string().min(1),
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: z.string().min(1),
  SHOPIFY_STORE_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY: z.string().optional(),
  KLAVIYO_PRIVATE_API_KEY: z.string().optional(),
  KLAVIYO_LIST_ID: z.string().optional(),
});

envSchema.parse(process.env);

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
