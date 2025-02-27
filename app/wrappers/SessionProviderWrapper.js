'use client';

import { SessionProvider } from 'next-auth/react';
import { NextUIProvider } from "@nextui-org/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {EmailProvider} from "@/app/context/EmailContext";
import {AdminDataManager} from "@/app/context/AdminDataManager";
import { ToastProvider } from '@heroui/toast';
import {RefreshProvider} from "@/app/context/RefreshContext";

export default function SessionProviderWrapper({ children }) {
    const queryClient = new QueryClient();
    return(
        <QueryClientProvider client={queryClient}>
            <AdminDataManager>
                <EmailProvider>
                    <RefreshProvider>
                        <NextUIProvider>
                            <ToastProvider placement="bottom-right" />
                            <SessionProvider>
                                    {children}
                            </SessionProvider>
                        </NextUIProvider>
                    </RefreshProvider>
                </EmailProvider>
            </AdminDataManager>
        </QueryClientProvider>

    );
}
