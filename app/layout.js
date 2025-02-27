import "./globals.css";
import SessionProviderWrapper from "@/app/wrappers/SessionProviderWrapper";
import React from "react";
import Footer from "@/app/components/utils/Footer";
import Dot from "@/components/animata/background/dot";
import { DM_Sans } from 'next/font/google';

const dmSans = DM_Sans({
    subsets: ['latin'],
    weight: ['400','700']
});

export const metadata = {
    title: "Spotly",
    description: "Booking your resources, our priority",
};

export default function RootLayout({children}) {
    return (
        <html lang="en">
        <body
            className={`${dmSans.className} antialiased flex flex-col min-h-screen `}
        >
        <main className="flex-grow">
            <Dot
                size={1}
                spacing={15}
                color={"#E7E5E4"}
            />
            <SessionProviderWrapper>{children}</SessionProviderWrapper>
        </main>
        <Footer />
        </body>

        </html>


    );
}
