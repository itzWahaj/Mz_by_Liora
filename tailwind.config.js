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
          DEFAULT: "#0F172A",
          accent: "#14B8A6",
          blue: {
            DEFAULT: "#1E5FBF",
            light: "#3B82F6",
            dark: "#0F3D8C",
          },
          teal: {
            DEFAULT: "#14B8A6",
            light: "#2DD4BF",
          },
          coral: {
            DEFAULT: "#E8734A",
            dark: "#C2410C",
          },
          purple: {
            DEFAULT: "#7C3AED",
            pink: "#DB2777",
          },
          // Backward-compatible alias used by existing classes.
          violet: "#7C3AED",
          navy: "#0F172A",
          cream: "#FAFAF9",
          surface: "#FAFAF9",
        },
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #1E5FBF 0%, #14B8A6 50%, #2DD4BF 100%)",
        "brand-gradient-warm":
          "linear-gradient(135deg, #E8734A 0%, #DB2777 50%, #7C3AED 100%)",
        "brand-gradient-full":
          "linear-gradient(120deg, #1E5FBF 0%, #14B8A6 30%, #E8734A 70%, #7C3AED 100%)",
        "brand-radial":
          "radial-gradient(circle, #3B82F6 0%, #14B8A6 40%, #E8734A 80%, #7C3AED 100%)",
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
