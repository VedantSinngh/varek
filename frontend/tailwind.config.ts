import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Thriftline customer palette
        cream:      "#F4ECDA",
        paper:      "#EDE2C9",
        ink:        "#2B241C",
        rust:       "#B4502B",
        mustard:    "#D9A441",
        olive:      "#5C6440",
        denim:      "#3A4A5C",
        brownDark:  "#241A12",
        line:       "#C9BB9C",
        // Admin palette
        adminBg:    "#0A0A0A",
        adminCard:  "#111111",
        adminBorder:"#1A1A1A",
        adminText:  "#F5F5F5",
        adminMuted: "#888888",
        adminGold:  "#C9A84C",
        // Legacy dark tokens (for old dashboard classes)
        background: "#0A0A0A",
        foreground: "#F5F5F5",
        sidebar:    "#111111",
        cardBg:     "#1A1A1A",
      },
      fontFamily: {
        display:     ["Fraunces", "Georgia", "serif"],
        mono:        ["Space Mono", "Courier New", "monospace"],
        handwritten: ["Caveat", "cursive"],
        sans:        ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-up":  "fade-up 0.6s ease forwards",
        "marquee":  "marquee-scroll 28s linear infinite",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "marquee-scroll": {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
