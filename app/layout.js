import "./globals.css";
import Providers from "@/config/providers/Providers";
import React from "react";
import Footer from "@/components/utils/Footer";
import {DM_Sans} from 'next/font/google';
import {metadata} from "@/config/metadata";
import {env} from '@/config/env.mjs';

const dmSans = DM_Sans({
    subsets: ['latin'],
    weight: ['400', '700'],
    variable: '--font-dm-sans'
});

export default function RootLayout({ children }) {

    return (
        <html lang="en" className={`${dmSans.variable}`}>
        <head>
            <title>{metadata.title}</title>
            <meta name="description" content={metadata.description} />
            <link rel="icon" href={`${env.basePath}/favicon.svg`} type="image/svg+xml" />
            <link rel="shortcut icon" href={`${env.basePath}/favicon.svg`} type="image/svg+xml" />
        </head>
        <body className="antialiased flex flex-col min-h-screen bg-neutral-100 dark:bg-neutral-900">
        <main className="flex-1">
            <Providers>
                {children}
            </Providers>
        </main>
       <footer>
           <Footer/>
       </footer>

        </body>

        </html>
    );
}
