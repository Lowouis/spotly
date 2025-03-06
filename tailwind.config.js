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
      "themes": {
          "light": {
              "colors": {
                  "default": {
                      "50": "#fafafa",
                      "100": "#f2f2f3",
                      "200": "#ebebec",
                      "300": "#e3e3e6",
                      "400": "#dcdcdf",
                      "500": "#2b2b2c",
                      "600": "#afafb2",
                      "700": "#29292b",
                      "800": "#656567",
                      "900": "#404041",
                      "foreground": "#000",
                      "DEFAULT": "#ebebec"
                  },
                  "primary": {
                      "50": "#dfedfd",
                      "100": "#b3d4fa",
                      "200": "#86bbf7",
                      "300": "#59a1f4",
                      "400": "#2d88f1",
                      "500": "#006fee",
                      "600": "#005cc4",
                      "700": "#00489b",
                      "800": "#003571",
                      "900": "#002147",
                      "foreground": "#fff",
                      "DEFAULT": "#006fee"
                  },
                  "secondary": {
                      "50": "#eee4f8",
                      "100": "#d7bfef",
                      "200": "#bf99e5",
                      "300": "#a773db",
                      "400": "#904ed2",
                      "500": "#7828c8",
                      "600": "#6321a5",
                      "700": "#4e1a82",
                      "800": "#39135f",
                      "900": "#240c3c",
                      "foreground": "#fff",
                      "DEFAULT": "#7828c8"
                  },
                  "success": {
                      "50": "#e2f8ec",
                      "100": "#b9efd1",
                      "200": "#91e5b5",
                      "300": "#68dc9a",
                      "400": "#40d27f",
                      "500": "#17c964",
                      "600": "#13a653",
                      "700": "#0f8341",
                      "800": "#0b5f30",
                      "900": "#073c1e",
                      "foreground": "#000",
                      "DEFAULT": "#17c964"
                  },
                  "warning": {
                      "50": "#fef4e4",
                      "100": "#fce4bd",
                      "200": "#fad497",
                      "300": "#f9c571",
                      "400": "#f7b54a",
                      "500": "#f5a524",
                      "600": "#ca881e",
                      "700": "#9f6b17",
                      "800": "#744e11",
                      "900": "#4a320b",
                      "foreground": "#000",
                      "DEFAULT": "#f5a524"
                  },
                  "danger": {
                      "50": "#fee1eb",
                      "100": "#fbb8cf",
                      "200": "#f98eb3",
                      "300": "#f76598",
                      "400": "#f53b7c",
                      "500": "#f31260",
                      "600": "#c80f4f",
                      "700": "#9e0c3e",
                      "800": "#73092e",
                      "900": "#49051d",
                      "foreground": "#000",
                      "DEFAULT": "#f31260"
                  },
                  "background": "#ffffff",
                  "foreground": "#000000",
                  "content1": {
                      "DEFAULT": "#ffffff",
                      "foreground": "#000"
                  },
                  "content2": {
                      "DEFAULT": "#f4f4f5",
                      "foreground": "#000"
                  },
                  "content3": {
                      "DEFAULT": "#e4e4e7",
                      "foreground": "#000"
                  },
                  "content4": {
                      "DEFAULT": "#d4d4d8",
                      "foreground": "#000"
                  },
                  "focus": "#006FEE",
                  "overlay": "#000000"
              }
          },
          "dark": {
              "colors": {
                  "default": {
                      "50": "#ECDFCC", // Lightest cream color
                      "100": "#D9CCBA", // Lighter cream
                      "200": "#C6B9A8", // Light cream
                      "300": "#B3A696", // Medium cream
                      "400": "#A09384", // Dark cream
                      "500": "#8D8072", // Darker cream
                      "600": "#697565", // Medium olive
                      "700": "#565D4F", // Darker olive
                      "800": "#3C3D37", // Very dark olive
                      "900": "#181C14", // Darkest green/black
                      "foreground": "#ECDFCC", // Text color on default background
                      "DEFAULT": "#3C3D37" // Default background
                  },
                  "primary": {
                      "50": "#E8EFE5", // Lightest olive
                      "100": "#D1DFCB", // Lighter olive
                      "200": "#BACFB1", // Light olive
                      "300": "#A3BF97", // Medium olive
                      "400": "#8CAF7D", // Dark olive
                      "500": "#697565", // Main olive
                      "600": "#566052", // Darker olive
                      "700": "#434C3F", // Very dark olive
                      "800": "#30382C", // Almost black olive
                      "900": "#181C14", // Darkest green/black
                      "foreground": "#ECDFCC", // Text color on primary
                      "DEFAULT": "#697565" // Default primary color
                  },
                  "secondary": {
                      "50": "#F5F2EC", // Lightest cream
                      "100": "#ECDFCC", // Light cream (your color)
                      "200": "#E2D3BD", // Cream
                      "300": "#D8C7AD", // Medium cream
                      "400": "#CEBB9E", // Dark cream
                      "500": "#C4AF8E", // Darker cream
                      "600": "#B0997A", // Brown cream
                      "700": "#9C8366", // Light brown
                      "800": "#886D52", // Medium brown
                      "900": "#74573E", // Dark brown
                      "foreground": "#181C14", // Text color on secondary
                      "DEFAULT": "#ECDFCC" // Default secondary color
                  },
                  "success": {
                      "50": "#E8EFE5", // Lightest success
                      "100": "#D1DFCB", // Lighter success
                      "200": "#BACFB1", // Light success
                      "300": "#A3BF97", // Medium success
                      "400": "#8CAF7D", // Dark success
                      "500": "#759F63", // Main success
                      "600": "#5E7F4F", // Darker success
                      "700": "#475F3B", // Very dark success
                      "800": "#303F27", // Almost black success
                      "900": "#181F13", // Darkest success
                      "foreground": "#181C14", // Text on success
                      "DEFAULT": "#759F63" // Default success color
                  },
                  "warning": {
                      "50": "#FEF6E6", // Lightest warning
                      "100": "#FDECCC", // Lighter warning
                      "200": "#FCE3B3", // Light warning
                      "300": "#FBD999", // Medium warning
                      "400": "#FAD080", // Dark warning
                      "500": "#F9C666", // Main warning
                      "600": "#C79F52", // Darker warning
                      "700": "#95773D", // Very dark warning
                      "800": "#634F29", // Almost black warning
                      "900": "#322814", // Darkest warning
                      "foreground": "#181C14", // Text on warning
                      "DEFAULT": "#F9C666" // Default warning color
                  },
                  "danger": {
                      "50": "#FDE8E8", // Lightest danger
                      "100": "#FBD0D0", // Lighter danger
                      "200": "#F9B9B9", // Light danger
                      "300": "#F7A1A1", // Medium danger
                      "400": "#F58A8A", // Dark danger
                      "500": "#F37272", // Main danger
                      "600": "#C25B5B", // Darker danger
                      "700": "#914444", // Very dark danger
                      "800": "#612E2E", // Almost black danger
                      "900": "#301717", // Darkest danger
                      "foreground": "#ECDFCC", // Text on danger
                      "DEFAULT": "#F37272" // Default danger color
                  },
                  "background": "#181C14", // Darkest green/black as background
                  "foreground": "#ECDFCC", // Cream as text color
                  "content1": {
                      "DEFAULT": "#1E231A", // Slightly lighter than background
                      "foreground": "#ECDFCC" // Cream text on content1
                  },
                  "content2": {
                      "DEFAULT": "#2A2F25", // Lighter than content1
                      "foreground": "#ECDFCC" // Cream text on content2
                  },
                  "content3": {
                      "DEFAULT": "#3C3D37", // Your dark olive color
                      "foreground": "#ECDFCC" // Cream text on content3
                  },
                  "content4": {
                      "DEFAULT": "#4E5048", // Lighter than content3
                      "foreground": "#ECDFCC" // Cream text on content4
                  },
                  "focus": "#697565", // Olive as focus color
                  "overlay": "#ECDFCC" // Cream as overlay
              }
          }
      },
      "layout": {
          "disabledOpacity": "0.5"
      }
    }),heroui()]}


