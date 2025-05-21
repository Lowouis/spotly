'use client';

import {ConnectionModal} from "@/components/modals/connectionModal";
import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import React from 'react';
import {QueryClient, QueryClientProvider, useQuery} from "@tanstack/react-query";
import SSOLoadingModal from "@/components/modals/SSOLoadingModal";

const checkSSOStatus = async () => {
    const response = await fetch('/api/auth/check-sso', {
        method: 'GET',
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Erreur lors de la vérification SSO');
    }
    return response.json();
};

function LoginContent() {
    const router = useRouter();
    const { status } = useSession();
    const {data: ssoData, isLoading: isSSOChecking} = useQuery({
        queryKey: ['ssoStatus'],
        queryFn: checkSSOStatus,
        retry: false,
        refetchOnWindowFocus: false
    });

    React.useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }
    }, [status, router]);

    if (isSSOChecking) {
        return <SSOLoadingModal/>;
    }

    if (ssoData?.isSSO) {
        return <SSOLoadingModal/>;
    }

    return (
        <div className="flex justify-center">
            <ConnectionModal/>
        </div>
    );
}

export default function Page() {
    const queryClient = new QueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <LoginContent/>
        </QueryClientProvider>
    );
}

