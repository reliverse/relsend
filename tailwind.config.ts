import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./emails/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#007291",
      },
    },
  },
  plugins: [],
};

export default config;
