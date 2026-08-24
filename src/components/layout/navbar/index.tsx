import { getCollections, getMenu } from "@/lib/shopify";
import NavbarClient from "./navbar-client";

export async function Navbar() {
  const [rawMenu, collections] = await Promise.all([
    getMenu("main-menu"),
    getCollections().catch(() => []),
  ]);
  const siteName = process.env.SITE_NAME || "MZ by LIORA";

  // Ensure "Customer Reviews" is present in the main menu
  const hasReviewsLink = rawMenu.some(
    (item) =>
      item.path === "/reviews" ||
      item.title.toLowerCase().includes("review")
  );

  const menu = [...rawMenu];
  if (!hasReviewsLink) {
    const ourStoryIndex = menu.findIndex(
      (item) =>
        item.title.toLowerCase() === "our story" ||
        item.title.toLowerCase().includes("story")
    );
    const reviewsItem = {
      title: "Customer Reviews",
      path: "/reviews",
    };

    if (ourStoryIndex !== -1) {
      menu.splice(ourStoryIndex, 0, reviewsItem);
    } else {
      const contactIndex = menu.findIndex(
        (item) => item.title.toLowerCase() === "contact"
      );
      if (contactIndex !== -1) {
        menu.splice(contactIndex, 0, reviewsItem);
      } else {
        menu.push(reviewsItem);
      }
    }
  }

  return (
    <NavbarClient
      menu={menu}
      collections={collections}
      siteName={siteName}
    />
  );
}
