'use client';

import {ConnectionModal} from "@/components/modals/connectionModal";
import {useRouter} from 'next/navigation';
import {useSession, signIn} from 'next-auth/react';
import React, {useState, useEffect} from 'react';
import {QueryClient, QueryClientProvider, useQuery} from "@tanstack/react-query";
import SSOLoadingModal from "@/components/modals/SSOLoadingModal";
import nextConfig from '../../next.config.mjs';
import DarkModeSwitch from "@/components/actions/DarkModeSwitch";
import {Button} from "@nextui-org/button";

const basePath = nextConfig.basePath || '';

const checkSSOStatus = async () => {
    console.log('Checking SSO status...');
    try {
        const response = await fetch(`${basePath}/api/public/check-sso`, {
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
    const [manualLogout, setManualLogout] = useState(false);
    const [ssoTicket, setSsoTicket] = useState(null);
    const [ssoReady, setSsoReady] = useState(false);

    // Lire le flag manualLogout au chargement
    useEffect(() => {
        setManualLogout(!!localStorage.getItem('manualLogout'));
    }, []);

    // Vérifie la présence d'une config Kerberos active
    useEffect(() => {
        fetch(`${basePath}/api/public/kerberos-config`)
            .then(res => {
                if (res.status === 200) {
                    setKerberosConfigExists(true);
                } else {
                    setKerberosConfigExists(false);
                }
            })
            .catch(() => setKerberosConfigExists(false));
    }, []);

    // Nettoyer le flag manualLogout uniquement si on est sur login, non authentifié, et pas de ticket SSO
    useEffect(() => {
        if (status === 'unauthenticated' && !ssoTicket) {
            localStorage.removeItem('manualLogout');
            setManualLogout(false);
        }
    }, [status, ssoTicket]);

    // Rediriger automatiquement si déjà authentifié
    useEffect(() => {
        if (status === 'authenticated' && typeof window !== 'undefined' && window.location.pathname !== `${basePath}/`) {
            window.location.href = `${basePath}/`;
        }
    }, [status]);

    const {data: ssoData, isLoading: isSSOChecking, error: queryError} = useQuery({
        queryKey: ['ssoStatus'],
        queryFn: checkSSOStatus,
        retry: (failureCount, error) => {
            if (error.message.includes('Authentification Negotiate requise') && failureCount < 2) {
                console.log('Challenge Negotiate reçu, nouvelle tentative...');
                return true;
            }
            return false;
        },
        refetchOnWindowFocus: false,
        enabled: kerberosConfigExists === true && status === 'unauthenticated' && !manualLogout,
        onSuccess: (data) => {
            if (data && data.ticket) {
                setSsoTicket(data.ticket);
                setSsoReady(true);
            } else {
                setSsoReady(false);
            }
        },
        onError: () => setSsoReady(false),
    });

    // Fonction pour lancer la connexion SSO manuellement
    const handleSsoLogin = async () => {
        localStorage.removeItem('manualLogout');
        setManualLogout(false);
        if (ssoTicket) {
            try {
                const kerberosResponse = await fetch(`${basePath}/api/auth/callback/kerberos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ticket: ssoTicket }),
                });
                if (!kerberosResponse.ok) {
                    const errorData = await kerberosResponse.json();
                    throw new Error(`Échec de la validation du ticket: ${errorData.error}`);
                }
                const user = await kerberosResponse.json();
                const res = await signIn('sso-login', {
                    redirect: false,
                    username: user.username,
                });
                if (res && res.ok) {
                    window.location.href = `${basePath}/`;
                } else {
                    throw new Error(res?.error || "Échec de la finalisation de la session NextAuth");
                }
            } catch (error) {
                setSsoError(error.message);
            }
        }
    };

    // Si la session est en cours de chargement (après soumission manuelle) ou déjà authentifiée, afficher le modal
    if (status === 'loading' || status === 'authenticated') {
        return <SSOLoadingModal />;
    }

    if (kerberosConfigExists === undefined || (kerberosConfigExists && isSSOChecking)) {
        return <SSOLoadingModal debugInfo={debugInfo} error={ssoError}/>;
    }

    return (
        <div className="flex flex-col items-center">
            <div className="absolute top-4 right-4">
                <DarkModeSwitch />
            </div>
            <ConnectionModal/>
            {ssoTicket && (
                <Button color="primary" onPress={handleSsoLogin} className="mb-4">
                    Connexion SSO
                </Button>
            )}
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

