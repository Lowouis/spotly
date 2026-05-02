/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./config/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}"
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
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
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
    plugins: []
}
