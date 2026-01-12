/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        grayLight: "#f3f4f6",
        blue: "#92BFFF",
        indigoLight: "#EDEEFC",
        tealLight: "#96E2D6",
        indigo: "#9F9FF8",
        greenLight: "#94E9B8",
        black: "#000000",
      },
    },
  },
};
