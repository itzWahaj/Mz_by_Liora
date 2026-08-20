const CART_BUTTON_SELECTOR = "[data-cart-button]";

type FlyToCartOptions = {
  imageUrl?: string | null;
  reducedMotion?: boolean;
};

/**
 * Animates a product thumbnail from `source` into the navbar cart button.
 * Does not open the cart drawer.
 */
export function flyToCart(
  source: HTMLElement,
  { imageUrl, reducedMotion }: FlyToCartOptions = {}
) {
  if (typeof document === "undefined") return;
  if (
    reducedMotion ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    pulseCartButton();
    return;
  }

  const target = document.querySelector(CART_BUTTON_SELECTOR) as HTMLElement | null;
  if (!target) return;

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();

  const size = Math.min(72, Math.max(44, from.width * 0.35));
  const startX = from.left + from.width / 2 - size / 2;
  const startY = from.top + from.height / 2 - size / 2;
  const endX = to.left + to.width / 2 - size / 2;
  const endY = to.top + to.height / 2 - size / 2;

  const ghost = document.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${startX}px`,
    top: `${startY}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "9999px",
    overflow: "hidden",
    zIndex: "9999",
    pointerEvents: "none",
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.22)",
    border: "2px solid rgba(255,255,255,0.9)",
    backgroundColor: "#fff",
    backgroundImage: imageUrl ? `url("${imageUrl}")` : "linear-gradient(135deg, #1E5FBF, #14B8A6)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    transition:
      "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.7s ease",
    transform: "translate3d(0,0,0) scale(1)",
    opacity: "1",
    willChange: "transform, opacity",
  } as CSSStyleDeclaration);

  document.body.appendChild(ghost);

  // Force layout, then animate toward cart.
  ghost.getBoundingClientRect();
  const dx = endX - startX;
  const dy = endY - startY;
  ghost.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(0.18)`;
  ghost.style.opacity = "0.35";

  window.setTimeout(() => {
    ghost.remove();
    pulseCartButton();
  }, 720);
}

function pulseCartButton() {
  const target = document.querySelector(CART_BUTTON_SELECTOR) as HTMLElement | null;
  if (!target) return;
  target.classList.add("cart-fly-pulse");
  window.setTimeout(() => target.classList.remove("cart-fly-pulse"), 450);
}
