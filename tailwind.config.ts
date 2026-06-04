import type { Config } from "tailwindcss";

/**
 * Cinematic dark theme. One locked accent (SIFF red) over a near-black
 * "screening room" neutral scale. Light text is a warm off-white (cream).
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        siff: {
          DEFAULT: "#e2362b",
          bright: "#ff5749",
          deep: "#b9271e",
        },
        night: {
          950: "#08080a",
          900: "#0d0d10",
          850: "#141418",
          800: "#1b1b21",
          750: "#23232b",
          700: "#2f2f39",
          600: "#42424f",
        },
        cream: "#f2efe9",
        gold: "#e9b949",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Segoe UI",
          "sans-serif",
        ],
      },
      maxWidth: {
        screen: "1320px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.6s ease-out both",
        "scale-in": "scale-in 0.4s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
