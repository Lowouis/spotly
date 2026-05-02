'use client';

import {SessionProvider} from 'next-auth/react';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {useState} from 'react';
import {EmailProvider} from "@/features/shared/context/EmailContext";
import {AdminDataManager} from "@/features/shared/context/AdminDataManager";
import {RefreshProvider} from "@/features/shared/context/RefreshContext";
import {ThemeProvider} from "@/features/shared/context/ThemeContext";
import {AuthProvider} from "@/features/shared/context/AuthContext";
import {publicEnv} from '@/config/publicEnv';
import {Toaster} from "@/components/ui/sonner";

const basePath = publicEnv.basePath;

export default function Providers({children}) {
    const [queryClient] = useState(() => new QueryClient());
    return(
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AdminDataManager>
                    <EmailProvider>
                        <RefreshProvider>
                            <Toaster position="bottom-right" visibleToasts={5} offset={16}/>
                            <SessionProvider basePath={`${basePath}/api/auth`}>
                                <AuthProvider>
                                    {children}
                                </AuthProvider>
                            </SessionProvider>
                        </RefreshProvider>
                    </EmailProvider>
                </AdminDataManager>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
