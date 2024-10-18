const {nextui} = require('@nextui-org/theme');
/** @type {import('tailwindcss').Config} */

module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
            },
        },
    },
    darkMode: "class",
    plugins: [nextui({
        themes: {
            dark: {
                colors: {
                    primary: {
                        DEFAULT: "#BEF264",
                        foreground: "#000000",
                    },
                    primaryLight: "#D0E7FF", // Light blue
                    primaryDark: "#0056B3", // Dark blue
                    secondary: "#3399FF", // Secondary blue
                    secondaryLight: "#B3D4FF", // Secondary light blue
                    secondaryDark: "#0066CC", // Secondary dark blue
                    focus: "#007BFF", // Focus color
                },
            }
        }
    })]
}
