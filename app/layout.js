import "./globals.css";
import localFont from "next/font/local";
import SessionProviderWrapper from "@/app/wrappers/SessionProviderWrapper";


const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Chronos",
  description: "Made for booking ressources ",
};

export default function RootLayout({children}) {
    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
        </body>
        </html>


    );
}
