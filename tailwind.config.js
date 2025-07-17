const {heroui} = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
    safelist: [
        'rotate-0',
        'rotate-45',
        'gap-8',
        'bg-neutral-900/50',
        'h-full',
        'overflow-visible',
        'backdrop-blur',
        'dark:bg-neutral-900/50',
        'dark:text-blue-400',
        'dark:hover:bg-gray-700'
    ],
    theme: {
        extend: {
            textColor: {
                // Couleurs de texte améliorées pour une meilleure lisibilité
                'content': {
                    primary: '#1a1a1a', // Plus foncé pour le texte principal en mode clair
                    secondary: '#404040', // Plus foncé pour le texte secondaire en mode clair
                    tertiary: '#666666', // Plus foncé pour le texte tertiaire en mode clair
                    muted: '#737373', // Plus foncé pour le texte atténué en mode clair
                },
                'dark-content': {
                    primary: '#f5f5f5', // Texte principal en mode sombre
                    secondary: '#e5e5e5', // Texte secondaire en mode sombre
                    tertiary: '#d4d4d4', // Texte tertiaire en mode sombre
                    muted: '#a3a3a3', // Texte atténué en mode sombre
                }
            }
        },
    },
    darkMode: "class",
    plugins: [
        heroui({
            themes: {
                light: {
                    colors: {
                        // Couleurs de base pour le thème clair
                        background: "#FFFFFF",
                        foreground: "#11181C",
                        default: {
                            100: "#f1f5f9",
                            200: "#e2e8f0",
                        },
                        primary: {
                            DEFAULT: "#4361EE",
                            foreground: "#FFFFFF"
                        },
                        secondary: {
                            DEFAULT: "#7209B7",
                            foreground: "#FFFFFF"
                        },
                        success: {
                            DEFAULT: "#2CB67D",
                            foreground: "#FFFFFF"
                        },
                        warning: {
                            DEFAULT: "#F9C74F",
                            foreground: "#000000"
                        },
                        danger: {
                            DEFAULT: "#E63946",
                            foreground: "#FFFFFF"
                        },
                        // Couleurs de contenu améliorées
                        content1: "#FFFFFF",
                        content2: "#F5F5F5",
                        content3: "#E5E5E5",
                        content4: "#D4D4D8"
                    }
                },
                dark: {
                    colors: {
                        // Couleurs de base pour le thème sombre
                        background: "#121212",
                        foreground: "#ECEDEE",
                        primary: {
                            DEFAULT: "#4CC2FF",
                            foreground: "#000000"
                        },
                        secondary: {
                            DEFAULT: "#BC8CF2",
                            foreground: "#000000"
                        },
                        success: {
                            DEFAULT: "#4ADE80",
                            foreground: "#000000"
                        },
                        warning: {
                            DEFAULT: "#FFD60A",
                            foreground: "#000000"
                        },
                        danger: {
                            DEFAULT: "#FF6B6B",
                            foreground: "#000000"
                        },
                        // Couleurs de contenu
                        content1: "#1E1E1E",
                        content2: "#2D2D2D",
                        content3: "#3E3E3E",
                        content4: "#505050"
                    }
                }
            },
        })
    ]
}