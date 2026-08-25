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
  NEXT_PUBLIC_JUDGEME_PUBLIC_TOKEN: z.string().optional(),
  JUDGEME_PRIVATE_TOKEN: z.string().optional(),
  NEXT_PUBLIC_JUDGEME_SHOP_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_META_PIXEL_ID: z.string().optional(),
  META_CAPI_ACCESS_TOKEN: z.string().optional(),
  META_CAPI_TEST_EVENT_CODE: z.string().optional(),
  SHOPIFY_WEBHOOK_SECRET: z.string().optional(),
});

envSchema.parse(process.env);

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
