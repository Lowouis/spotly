import "./globals.css";
import SessionProviderWrapper from "@/app/wrappers/SessionProviderWrapper";
import React from "react";
import Footer from "@/app/components/utils/Footer";
import Dot from "@/components/animata/background/dot";
import { DM_Sans } from 'next/font/google';
import { metadata } from "@/app/metadata";

const dmSans = DM_Sans({
    subsets: ['latin'],
    weight: ['400', '700'],
    variable: '--font-dm-sans'
});

export default function RootLayout({ children }) {
    // get local theme state from context

    return (
        <html lang="en" className={dmSans.variable}>
        <head>
            <title>{metadata.title}</title>
            <meta name="description" content={metadata.description} />
        </head>
        <body className="antialiased flex flex-col min-h-screen">
        <main className="flex-1">
            <SessionProviderWrapper>
                <Dot
                    size={1}
                    spacing={40}
                />
                {children}
            </SessionProviderWrapper>
        </main>
       <footer>
           <Footer/>
       </footer>

        </body>

        </html>
    );
}