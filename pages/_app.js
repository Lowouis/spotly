import '../app/globals.css';
import RootLayout from '@/app/layout';
import React from "react";
import SessionProviderWrapper from "@/app/wrappers/SessionProviderWrapper";

export default function App({ Component, pageProps }) {
    return (
        <SessionProviderWrapper>
            <main className="flex-1">
                <Component {...pageProps} />
            </main>
        </SessionProviderWrapper>

        );
}