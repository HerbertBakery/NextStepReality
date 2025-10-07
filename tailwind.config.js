/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",       // all files in the app directory
    "./components/**/*.{js,ts,jsx,tsx}", // all files in the components directory
    "./pages/**/*.{js,ts,jsx,tsx}",      // (optional) if you ever use the old pages router
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366f1",
          dark: "#4f46e5",
        },
        bg: "#0a0f1c",
        "bg-soft": "#11182a",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
