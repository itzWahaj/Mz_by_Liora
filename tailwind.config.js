const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').config} */

module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#303515", // Normal Text: Dark Olive
          heading: "#4D581E", // Headings: Deep Olive Green
          olive: {
            DEFAULT: "#596522", // Buttons: Olive Green
            deep: "#4D581E",    // Headings: Deep Olive
            dark: "#303515",    // Normal Text: Dark Olive
            light: "#70802B",
            subtle: "#F4F6EC",
          },
          gold: {
            DEFAULT: "#C49A45", // Button Hover / Accents: Antique Gold
            light: "#D8BB7A",   // Borders: Soft Champagne Gold
            champagne: "#D8BB7A",
            dark: "#A37C2E",
            subtle: "#FAF5E8",
          },
          champagne: "#D8BB7A", // Borders: Soft Champagne Gold
          cream: "#FAF9F4",     // Background: Warm Ivory
          surface: "#FAF9F4",   // Background: Warm Ivory
          card: "#FFFDF8",      // Product Cards: Soft Cream
          accent: "#C49A45",    // Small Accents: Antique Gold

          // Seamless backward-compatible color aliases
          teal: {
            DEFAULT: "#596522",
            light: "#C49A45",
            dark: "#4D581E",
          },
          blue: {
            DEFAULT: "#4D581E",
            light: "#596522",
            dark: "#303515",
          },
          coral: {
            DEFAULT: "#C49A45",
            dark: "#A37C2E",
          },
          purple: {
            DEFAULT: "#596522",
            pink: "#C49A45",
          },
          violet: "#596522",
          navy: "#303515",
        },
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #596522 0%, #4D581E 100%)",
        "brand-gradient-hover":
          "linear-gradient(135deg, #C49A45 0%, #D8BB7A 100%)",
        "brand-gradient-gold":
          "linear-gradient(135deg, #C49A45 0%, #D8BB7A 100%)",
        "brand-gradient-warm":
          "linear-gradient(135deg, #596522 0%, #C49A45 100%)",
        "brand-gradient-full":
          "linear-gradient(120deg, #596522 0%, #4D581E 40%, #C49A45 75%, #D8BB7A 100%)",
        "brand-radial":
          "radial-gradient(circle, #D8BB7A 0%, #FAF9F4 70%)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: {
            opacity: 1,
          },
        },
      },
      blink: {
        "0%": { opacity: 0.2 },
        "20%": { opacity: 1 },
        "100%": { opacity: 0.2 },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-in-out",
        blink: "blink 1.4s both infinite",
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/container-queries"),
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          "animation-delay": (value) => {
            return {
              "animation-delay": value,
            };
          },
        },
        {
          values: theme("transitionDelay"),
        }
      );
    }),
  ],
};
