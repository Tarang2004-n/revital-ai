/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#070A12",
        panel: "#0D1322",
        "panel-subtle": "#121A2D",
        "cyan-clinical": "#00F0FF",
        "amber-breach": "#FFB800",
        "emerald-fork": "#10B981",
        "rose-critical": "#F43F5E",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        clay: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.1), 0 10px 25px -5px rgba(0, 0, 0, 0.5)",
        "glow-cyan": "0 0 15px rgba(0, 240, 255, 0.25)",
        "glow-amber": "0 0 15px rgba(255, 184, 0, 0.25)",
        "glow-emerald": "0 0 15px rgba(16, 185, 129, 0.25)",
      },
    },
  },
  plugins: [],
};
