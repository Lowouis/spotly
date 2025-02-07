import '../app/globals.css';
import { SessionProvider } from "next-auth/react";
import Footer from "@/app/components/utils/Footer";
import React from "react";


export default function App({ Component, pageProps }) {
    return (

            <SessionProvider session={pageProps.session}>
                <Component {...pageProps} />
                <Footer />
            </SessionProvider>

        );
}