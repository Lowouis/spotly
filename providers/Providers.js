'use client';

import { SessionProvider } from 'next-auth/react';
import { NextUIProvider } from "@nextui-org/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {EmailProvider} from "@/context/EmailContext";
import {AdminDataManager} from "@/context/AdminDataManager";
import { ToastProvider } from '@heroui/toast';
import {RefreshProvider} from "@/context/RefreshContext";
import {ThemeProvider} from "@/context/ThemeContext";

export default function Providers({children}) {
    const queryClient = new QueryClient();
    return(
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AdminDataManager>
                    <EmailProvider>
                        <RefreshProvider>
                            <NextUIProvider>
                                <ToastProvider
                                    placement="bottom-right"
                                    maxVisibleToasts={5}
                                    toastOffset={16}
                                />
                                <SessionProvider>
                                    {children}
                                </SessionProvider>
                            </NextUIProvider>
                        </RefreshProvider>
                    </EmailProvider>
                </AdminDataManager>
            </ThemeProvider>
        </QueryClientProvider>

    );
}
