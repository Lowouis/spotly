'use client';

import {ConnectionModal} from "@/components/modals/connectionModal";
import {useRouter} from 'next/navigation';
import {useSession, signIn} from 'next-auth/react';
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
        fetch(`${basePath}/api/sso/kerberos-config`)
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
        retry: (failureCount, error) => {
            // Si c'est le challenge Negotiate (normal), et qu'on n'a pas déjà tenté, on retente une fois.
            if (error.message.includes('Authentification Negotiate requise') && failureCount < 2) {
                console.log('Challenge Negotiate reçu, nouvelle tentative...');
                return true;
            }
            // Pour toute autre erreur, on abandonne.
            return false;
        },
        refetchOnWindowFocus: false,
        enabled: kerberosConfigExists, // n'active la requête SSO que si la config existe
        onSuccess: async (data) => {
            if (data.ticket) {
                console.log('Ticket SSO reçu, tentative de connexion via NextAuth...');
                const res = await signIn('kerberos', {
                    redirect: false,
                    ticket: data.ticket
                });

                if (res && res.ok) {
                    console.log('Connexion via NextAuth réussie. Redirection...');
                    // On recharge la page à la racine pour que tous les contextes soient mis à jour
                    window.location.href = `${basePath}/`;
                } else {
                    console.error("Échec de la connexion NextAuth :", res?.error);
                    setSsoError(res?.error || "Une erreur est survenue lors de la finalisation de la connexion SSO.");
                }
            } else {
                setSsoError("Réponse SSO invalide du serveur (ticket manquant).");
            }
        },
        onError: (error) => {
            // N'afficher une erreur que si ce n'est PAS le challenge Negotiate attendu
            if (!error.message.includes('Authentification Negotiate requise')) {
                console.error('SSO check failed:', error);
                setDebugInfo({error: error.message});
                setSsoError(error.message);
            }
        }
    });

    // Si le status de la session next-auth est déjà authentifié, on ne fait rien et on attend la redirection
    if (status === 'authenticated') {
        return <SSOLoadingModal/>;
    }

    if (kerberosConfigExists === undefined || (kerberosConfigExists && isSSOChecking)) {
        // On attend de savoir si la config existe OU si la vérification SSO est en cours
        return <SSOLoadingModal debugInfo={debugInfo} error={ssoError}/>;
    }

    // Le SSO a échoué ou n'est pas configuré, on affiche le formulaire de connexion manuelle
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

