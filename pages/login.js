import {ConnectionModal} from "@/app/components/connectionModal";
import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import React, {useEffect} from 'react';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import Footer from "@/app/components/utils/Footer";


export default function Login() {
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

