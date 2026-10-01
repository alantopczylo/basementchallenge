import type { Config } from "tailwindcss";

const config: Config = {
  // hover: solo donde hay hover real (mouse). En celular y tablet el toque no deja estados "pegados" ni gasta transiciones
  future: { hoverOnlyWhenSupported: true },
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        basement: {
          white: "#e6e6e6",
          orange: "#ff4d00",
          black: "#000000",
          grey: "#666666",
          "dark-grey": "#2e2e2e",
          "light-grey": "#c4c4c4",
        },
      },
      fontFamily: {
        geist: [
          "var(--font-geist)",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: ["var(--font-geist-mono)", "SF Mono", "Monaco", "monospace"],
      },
      fontSize: {
        display: ["76px", { lineHeight: "0.9", letterSpacing: "-0.04em" }],
        h1: ["76px", { lineHeight: "0.9", letterSpacing: "-0.04em" }],
        h2: ["38px", { lineHeight: "0.95", letterSpacing: "-0.04em" }],
        h3: ["24px", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
        "body-semibold": ["16px", { lineHeight: "1.3", letterSpacing: "0" }],
        "body-medium": ["16px", { lineHeight: "1.3", letterSpacing: "0" }],
        body: ["16px", { lineHeight: "1.3", letterSpacing: "0" }],
        mono: ["14px", { lineHeight: "1.4", letterSpacing: "-0.01em" }],
        caption: ["13px", { lineHeight: "1", letterSpacing: "0" }],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        // Ritmo vertical entre bloques de página (usar: mt-section-lg, pb-section-sm, mt-content…)
        "section-sm": "100px",
        "section-md": "120px",
        "section-lg": "160px",
        "section-xl": "190px",
        content: "144px",
      },
      borderRadius: {
        xs: "4px",
        sm: "4px",
        md: "8px",
        lg: "10px",
      },
      boxShadow: {
        navbar: "0px 3px 15px 0px rgba(18, 18, 18, 0.05)",
        "button-inset":
          "inset 0px 1px 2px 0px rgba(255, 255, 255, 0.1), inset 0px -1px 2px 0px rgba(255, 255, 255, 0.1)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
