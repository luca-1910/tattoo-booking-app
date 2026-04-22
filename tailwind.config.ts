import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        "bg-surface": "var(--color-bg-surface)",
        "bg-inset": "var(--color-bg-inset)",
        fg: "var(--color-fg)",
        "fg-muted": "var(--color-fg-muted)",
        "fg-subtle": "var(--color-fg-subtle)",
        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        "accent-soft": "var(--color-accent-soft)",
        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",
      },
      fontFamily: {
        display: "var(--font-display)",
        ui: "var(--font-ui)",
      },
      borderRadius: {
        DEFAULT: "4px",
        card: "8px",
      },
    },
  },
  plugins: [],
};
export default config;
