/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        arcade: {
          bg: "#121212",
          green: "#00FF00",
          magenta: "#FF00FF",
          cyan: "#00FFFF",
          yellow: "#FFFF00",
          red: "#FF0000",
        },
      },
      fontFamily: {
        arcade: ['var(--font-arcade)', 'cursive'],
        terminal: ['var(--font-terminal)', 'monospace'],
        pixel: ['var(--font-pixel)', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        "glow": {
          "0%, 100%": { filter: "brightness(100%)" },
          "50%": { filter: "brightness(150%)" },
        },
        "scanline": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },
        "flicker": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        "glow": "glow 2s ease-in-out infinite",
        "scanline": "scanline 8s linear infinite",
        "flicker": "flicker 0.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
