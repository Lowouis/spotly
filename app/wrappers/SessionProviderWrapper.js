'use client';

import { SessionProvider } from 'next-auth/react';
import { NextUIProvider } from "@nextui-org/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {EmailProvider} from "@/app/context/EmailContext";

export default function SessionProviderWrapper({ children }) {
    const queryClient = new QueryClient();
    return(
        <QueryClientProvider client={queryClient}>
            <EmailProvider>
                <NextUIProvider>
                    <SessionProvider>
                            {children}
                    </SessionProvider>
                </NextUIProvider>
            </EmailProvider>
        </QueryClientProvider>

    );
}
