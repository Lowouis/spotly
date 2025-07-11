'use client';

import {SessionProvider} from 'next-auth/react';
import {HeroUIProvider} from "@heroui/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {EmailProvider} from "@/context/EmailContext";
import {AdminDataManager} from "@/context/AdminDataManager";
import {ToastProvider} from '@heroui/toast';
import {RefreshProvider} from "@/context/RefreshContext";
import {ThemeProvider} from "@/context/ThemeContext";
import {AuthProvider} from "@/context/AuthContext";
import nextConfig from '../next.config.mjs';

const basePath = nextConfig.basePath || '';

export default function Providers({children}) {
    const queryClient = new QueryClient();
    return(
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AdminDataManager>
                    <EmailProvider>
                        <RefreshProvider>
                            <HeroUIProvider>
                                <ToastProvider
                                    placement="bottom-right"
                                    maxVisibleToasts={5}
                                    toastOffset={16}
                                />
                                <SessionProvider basePath={`${basePath}/api/auth`}>
                                    <AuthProvider>
                                        {children}
                                    </AuthProvider>
                                </SessionProvider>
                            </HeroUIProvider>
                        </RefreshProvider>
                    </EmailProvider>
                </AdminDataManager>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
