'use client';

import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import React, {useEffect} from 'react';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {RegisterModal} from "@/components/modals/registerModal";
import DarkModeSwitch from "@/components/actions/DarkModeSwitch";

export default function Page() {
    const router = useRouter();
    const {status} = useSession();
    const queryClient = new QueryClient();

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }
    }, [status, router]);

    return (
        <QueryClientProvider client={queryClient}>
            <div className="relative min-h-screen bg-neutral-50 dark:bg-neutral-900">
                {/* Header avec switch de thème */}
                <header className="absolute right-0 top-0 z-10 flex justify-end p-4">
                    <DarkModeSwitch />
                </header>

                {/* Contenu principal centré */}
                <main className="flex min-h-screen items-center justify-center px-4 py-8">
                    <RegisterModal/>
                </main>
            </div>
        </QueryClientProvider>
    );
}
