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
            keyframes: {
                "pop-blob": {
                    "0%": { transform: "scale(1)" },
                    "33%": { transform: "scale(1.2)" },
                    "66%": { transform: "scale(0.8)" },
                    "100%": { transform: "scale(1)" },
                },
                colors: {
                    filter: {
                        "blur-20": "blur(20px)",
                        "blur-25": "blur(25px)",
                    },
                },
                animation: {
                    "pop-blob": "pop-blob 5s infinite",
                }
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
