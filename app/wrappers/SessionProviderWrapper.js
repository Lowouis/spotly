'use client';

import { SessionProvider } from 'next-auth/react';
import { NextUIProvider } from "@nextui-org/react";

export default function SessionProviderWrapper({ children }) {
    return(
        <NextUIProvider>
            <SessionProvider>
                    {children}
            </SessionProvider>
        </NextUIProvider>

    );
}
