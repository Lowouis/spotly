import '../app/globals.css';
import { SessionProvider } from "next-auth/react";
import RootLayout from "@/app/layout";

export default function App({ Component, pageProps }) {
    return (

            <SessionProvider session={pageProps.session}>
                <Component {...pageProps} />
            </SessionProvider>
   
        );
}