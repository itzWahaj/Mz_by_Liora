import { getCollections, getMenu } from "@/lib/shopify";
import NavbarClient from "./navbar-client";

export async function Navbar() {
  const [menu, collections] = await Promise.all([
    getMenu("main-menu"),
    getCollections().catch(() => []),
  ]);
  const siteName = process.env.SITE_NAME || "MZ by LIORA";

  return (
    <NavbarClient
      menu={menu}
      collections={collections}
      siteName={siteName}
    />
  );
}
