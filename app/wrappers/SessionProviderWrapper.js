'use client';

import { SessionProvider } from 'next-auth/react';
import { NextUIProvider } from "@nextui-org/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

export default function SessionProviderWrapper({ children }) {
    const queryClient = new QueryClient();
    return(
        <QueryClientProvider client={queryClient}>
            <NextUIProvider>
                <SessionProvider>
                        {children}
                </SessionProvider>
            </NextUIProvider>
        </QueryClientProvider>

    );
}
