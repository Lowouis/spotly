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
            <div className="flex flex-col items-center">
                <div className="absolute top-4 right-4">
                    <DarkModeSwitch />
                </div>
                <RegisterModal/>
            </div>
        </QueryClientProvider>
    );
}

