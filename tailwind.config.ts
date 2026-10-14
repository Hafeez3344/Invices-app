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
        brand: {
          DEFAULT: "#204978",
          dark: "#18365a",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        cairo: ["var(--font-cairo)", "Tahoma", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
