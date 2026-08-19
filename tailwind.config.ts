import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens. Values live as `R G B` triplets in globals.css so the
        // same class works in both themes and supports /opacity modifiers.
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        "on-primary": "rgb(var(--on-primary) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        danger: "#ef4444",
        // Legacy aliases kept so existing `bg-background-light dark:bg-background-dark`
        // pairs stay correct without a sweep.
        "background-light": "#f8fafc",
        "background-dark": "#0b1120",
      },
      fontFamily: {
        display: ["var(--font-geist)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        none: "0",
        sm: "4px",
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
        xl: "8px",
        "2xl": "12px",
        "3xl": "16px",
        full: "9999px",
      },
      boxShadow: {
        // "Flat-plus": 1px border at rest, this on hover. No ambient elevation.
        hover: "0 4px 12px rgb(15 23 42 / 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
