'use client';

import {SessionProvider} from 'next-auth/react';
import {HeroUIProvider} from "@heroui/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {useState} from 'react';
import {EmailProvider} from "@/features/shared/context/EmailContext";
import {AdminDataManager} from "@/features/shared/context/AdminDataManager";
import {ToastProvider} from '@heroui/toast';
import {RefreshProvider} from "@/features/shared/context/RefreshContext";
import {ThemeProvider} from "@/features/shared/context/ThemeContext";
import {AuthProvider} from "@/features/shared/context/AuthContext";
import {publicEnv} from '@/config/publicEnv';

const basePath = publicEnv.basePath;

export default function Providers({children}) {
    const [queryClient] = useState(() => new QueryClient());
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
