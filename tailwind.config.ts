import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tcw: {
          ink: "#251733",
          plum: "#4C256A",
          purple: "#6E35A0",
          berry: "#B83280",
          pink: "#E85BA8",
          blush: "#FBEAF4",
          cream: "#FFF8EF",
          mist: "#F4F1F7",
          line: "#E5DDEC",
        },
        energy: {
          blue: "#2F6FA7",
          red: "#CF3D3D",
          green: "#36865B",
          yellow: "#D89D24",
        },
      },
      boxShadow: {
        card: "0 18px 40px rgba(37, 23, 51, 0.14)",
        soft: "0 12px 32px rgba(76, 37, 106, 0.12)",
      },
      fontFamily: {
        sans: [
          "Avenir Next",
          "Avenir",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
