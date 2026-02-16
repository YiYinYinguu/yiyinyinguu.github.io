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
        primary: {
          DEFAULT: "#b12b32",
          hover: "#8a2228",
        },
        header: "#f0f0f0",
      },
      fontFamily: {
        sans: ["Open Sans", "sans-serif"],
        alegreya: ["Alegreya", "serif"],
        pingfang: ["PingFang SC", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
