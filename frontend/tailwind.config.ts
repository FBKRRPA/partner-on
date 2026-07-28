import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fujifilm: {
          green: "#01916D",
          darkGreen: "#006449",
          lightGreen: "#00D164",
          brightGreen: "#00FF52",
          cyan: "#96FFFD",
          red: "#E01E35",
        },
        innovative: {
          DEFAULT: "#333333",
          80: "#5C5C5C",
          60: "#858585",
          40: "#ADADAD",
          20: "#D6D6D6",
          10: "#EBEBEB",
        },
      },
    },
  },
  plugins: [],
};

export default config;
