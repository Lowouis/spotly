'use client';

import {ConnectionModal} from "@/components/modals/connectionModal";
import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import React, {useState, useEffect} from 'react';
import {QueryClient, QueryClientProvider, useQuery} from "@tanstack/react-query";
import SSOLoadingModal from "@/components/modals/SSOLoadingModal";
import nextConfig from '../../next.config.mjs';
import DarkModeSwitch from "@/components/actions/DarkModeSwitch";

const basePath = nextConfig.basePath || '';

const checkSSOStatus = async () => {
    console.log('Checking SSO status...');
    try {
        const response = await fetch(`${basePath}/api/auth/check-sso`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });
        console.log('SSO check response status:', response.status);

        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                throw new Error(`Erreur lors de la vérification SSO: ${errorData.message || response.statusText}`);
            } else {
                throw new Error(`Erreur lors de la vérification SSO: ${response.status} ${response.statusText}`);
            }
        }

        const data = await response.json();
        console.log('SSO check response data:', data);

        // Vérification plus détaillée de l'état SSO
        if (data.status === 'not_authenticated') {
            console.log('SSO non authentifié - détails:', data.debug);
            return {...data, isSSO: false};
        }

        if (data.status === 'pending' && !data.debug.auth.ticketPresent) {
            console.log('SSO en attente mais pas de ticket - détails:', data.debug);
            return {...data, isSSO: false};
        }

        return data;
    } catch (error) {
        console.error('SSO check error:', error);
        return {
            status: 'error',
            isSSO: false,
            error: error.message
        };
    }
};

function LoginContent() {
    const router = useRouter();
    const { status } = useSession();
    const [debugInfo, setDebugInfo] = useState(null);
    const [ssoError, setSsoError] = useState(null);
    const [kerberosConfigExists, setKerberosConfigExists] = useState(undefined);

    // Vérifie la présence d'une config Kerberos active
    useEffect(() => {
        fetch('/api/sso/kerberos-config')
            .then(res => {
                if (res.status === 200) {
                    setKerberosConfigExists(true);
                } else {
                    setKerberosConfigExists(false);
                }
            })
            .catch(() => setKerberosConfigExists(false));
    }, []);

    const {data: ssoData, isLoading: isSSOChecking, error: queryError} = useQuery({
        queryKey: ['ssoStatus'],
        queryFn: checkSSOStatus,
        retry: false,
        refetchOnWindowFocus: false,
        enabled: kerberosConfigExists, // n'active la requête SSO que si la config existe
        onSuccess: (data) => {
            console.log('SSO check successful:', data);
            setDebugInfo(data.debug);
            if (data.status === 'not_authenticated') {
                setSsoError('Pas d\'authentification SSO détectée');
            } else if (data.status === 'pending' && !data.debug.auth.ticketPresent) {
                setSsoError('Ticket SSO manquant ou invalide');
            }
        },
        onError: (error) => {
            console.error('SSO check failed:', error);
            setDebugInfo({error: error.message});
            setSsoError(error.message);
        }
    });

    if (kerberosConfigExists === undefined) {
        // On attend de savoir si la config existe
        return null;
    }

    if (kerberosConfigExists && isSSOChecking) {
        return <SSOLoadingModal debugInfo={debugInfo} error={ssoError}/>;
    }

    if (kerberosConfigExists && ssoData?.isSSO) {
        return <SSOLoadingModal debugInfo={debugInfo} error={ssoError}/>;
    }

    
    return (
        <div className="flex flex-col items-center">
            <div className="absolute top-4 right-4">
                <DarkModeSwitch />
            </div>
            <ConnectionModal/>
            {debugInfo && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg max-w-lg w-full">
                    <h3 className="text-lg font-semibold mb-2">Informations de débogage SSO</h3>
                    {ssoError && (
                        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                            {ssoError}
                        </div>
                    )}
                    <pre className="text-sm overflow-auto">
                        {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                </div>
            )}
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

