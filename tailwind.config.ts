import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F5F5DC",
        "cream-dark": "#EDE8C8",
        brown: {
          DEFAULT: "#3E2723",
          light: "#6D4C41",
          dark: "#1B0000",
        },
        green: {
          DEFAULT: "#2E7D32",
          light: "#4CAF50",
          dark: "#1B5E20",
        },
        sepia: "#A0856C",
      },
      fontFamily: {
        serif: ["Noto Sans JP", "sans-serif"],
        body: ["Noto Sans JP", "sans-serif"],
      },

      backgroundImage: {
        "paper-texture": "url('/paper-texture.png')",
      },
      boxShadow: {
        antique: "0 2px 8px rgba(62, 39, 35, 0.2), inset 0 0 0 1px rgba(62, 39, 35, 0.15)",
        "antique-lg": "0 4px 20px rgba(62, 39, 35, 0.25), inset 0 0 0 1px rgba(62, 39, 35, 0.2)",
      },
      borderRadius: {
        photo: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
