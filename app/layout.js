import "./globals.css";
import localFont from "next/font/local";
import SessionProviderWrapper from "@/app/wrappers/SessionProviderWrapper";
import React from "react";
import Footer from "@/app/components/utils/Footer";



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
    title: "Spotly",
    description: "Booking your resources, our priority",
};

export default function RootLayout({children}) {
    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen `}
        >
        <main className="flex-grow">
            <SessionProviderWrapper>{children}</SessionProviderWrapper>
        </main>
        <Footer />
        </body>

        </html>


    );
}
