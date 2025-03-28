'use client';

import {ConnectionModal} from "@/components/modals/connectionModal";
import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import React, {useEffect} from 'react';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";


export default function Page() {
    const router = useRouter();
    const { status } = useSession();
    const queryClient = new QueryClient();

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }
    }, [status, router]);

    return (
        <QueryClientProvider client={queryClient}>
                <div className="flex justify-center">
                    <ConnectionModal />
                </div>
        </QueryClientProvider>
    );
}

