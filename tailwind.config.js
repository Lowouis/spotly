const {heroui} = require('@heroui/theme');
const {nextui} = require('@nextui-org/theme');
/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/components/(toast|spinner).js"
  ],
    darkMode: "class",
  plugins: [nextui({
      "layout": {
          "disabledOpacity": "0.5"
      }
    }),heroui()]}


