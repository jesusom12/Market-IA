/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1d2a27",
        moss: "#44634b",
        leaf: "#b8d3a8",
        cream: "#f8f5ef",
        sand: "#efe7d8",
        coral: "#e96f5c",
      },
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 18px 50px rgba(29, 42, 39, 0.08)",
        card: "0 8px 30px rgba(29, 42, 39, 0.06)",
      },
    },
  },
  plugins: [],
};
