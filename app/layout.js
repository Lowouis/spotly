import "./globals.css";
import localFont from "next/font/local";
import SessionProviderWrapper from "@/app/wrappers/SessionProviderWrapper";
import React from "react";
import {Divider} from "@nextui-org/react";



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
    description: "Made for booking ressources ",
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
        <footer className="w-full bg-gradient-to-t from-slate-50 to-transparent text-slate-500 text-center py-4">
            <div className="flex flex-row justify-center items-center w-full ">
                <div className="flex flex-row space-x-3 justify-start items-start">
                    <div className="flex flex-row space-x-4 justify-start ">
                        <span>Spotly Copyright © 2025 </span>
                    </div>
                    <Divider orientation="vertical" className="h-6 rounded-full"/>
                    <div
                        className="flex flex-row justify-center items-center space-x-1 transition-all">
                        <h3 className="hover:cursor-pointer hover:text-slate-900 ">Github</h3>
                    </div>
                    <div
                        className="flex flex-row justify-center items-center space-x-1 transition-all">
                        <h3 className="hover:cursor-pointer hover:text-slate-900 ">LinkedIn</h3>
                    </div>
                    <div
                        className="flex flex-row justify-center items-center space-x-1 transition-all">
                        <h3 className="hover:cursor-pointer hover:text-slate-900 ">Youtube</h3>
                    </div>
                    <div
                        className="flex flex-row justify-center items-center space-x-1 transition-all">
                        <h3 className="hover:cursor-pointer hover:text-slate-900 ">FAQ</h3>
                    </div>
                </div>
            </div>
        </footer>
        </body>

        </html>


    );
}
