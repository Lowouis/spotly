'use client';

import ConnectionModal from "@/components/modals/connectionModal";
import {useRouter, useSearchParams} from 'next/navigation';
import {useSession} from 'next-auth/react';
import React, {useEffect, useRef, useState} from 'react';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import SSOLoadingModal from "@/components/modals/SSOLoadingModal";
import DarkModeSwitch from "@/components/actions/DarkModeSwitch";
import {Button, Spinner} from "@heroui/react";
import {useSSO} from '@/hooks/useSSO';
import {addToast} from "@heroui/toast";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { status } = useSession();
    const ssoParam = searchParams.get('sso');
    const [autoSsoAttempted, setAutoSsoAttempted] = useState(false);
    const ssoTimeoutRef = useRef(null);

    useEffect(() => {
        if(status === 'authenticated'){
            router.replace("/");
        }
    }, [status, router]);

    const {
        isLoading: isSSOChecking,
        error: ssoError,
        debug: ssoDebug,
        kerberosConfigExists,
        checkTicket,
        ssoLogin
    } = useSSO({ssoParam, status});

    useEffect(() => {
        console.log(`[DEBUG SSO Trigger Check] ssoParam: ${ssoParam}, kerberosConfigExists: ${kerberosConfigExists}, status: ${status}, autoSsoAttempted: ${autoSsoAttempted}`);
        // On attend que la session soit bien vérifiée, non authentifiée, et qu'on n'ait pas déjà tenté le SSO
        if (ssoParam === "1" && kerberosConfigExists && status === 'unauthenticated' && !autoSsoAttempted) {
            setAutoSsoAttempted(true); // Verrouiller pour ne pas retenter

            // Supprime le paramètre sso de l'URL en utilisant le routeur Next.js
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('sso');
            const newUrl = `/login?${newSearchParams.toString()}`;
            router.replace(newUrl);

            ssoTimeoutRef.current = setTimeout(() => {
                console.log('[DEBUG SSO Trigger] Déclenchement de handleSSOClick.');
                handleSSOClick();
            }, 600);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ssoParam, kerberosConfigExists, status]);

    // Effet de nettoyage qui ne s'exécute qu'à la destruction du composant
    useEffect(() => {
        return () => {
            if (ssoTimeoutRef.current) {
                clearTimeout(ssoTimeoutRef.current);
            }
        };
    }, []);

    const handleSSOClick = async () => {
        try {
            const ticket = await checkTicket();
            if (!ticket) {
                addToast({
                    title: "Authentification SSO",
                    description: "Aucun ticket Kerberos détecté.",
                    color: "danger"
                });
                return;
            }
            await ssoLogin(ticket);
        } catch (e) {
            addToast({
                title: "Erreur SSO",
                description: e.message || "Une erreur est survenue lors de l'authentification.",
                color: "danger"
            });
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner label="Chargement..." color="primary" />
            </div>
        );
    }

    if (kerberosConfigExists && isSSOChecking) {
        return <SSOLoadingModal debugInfo={ssoDebug} error={ssoError}/>;
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col">
            {/* Header avec switch de thème */}
            <header className="flex justify-end p-4">
                <DarkModeSwitch />
            </header>

            {/* Contenu principal centré */}
            <main className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-md">
            <ConnectionModal />

                    {/* Bouton SSO */}
                    {kerberosConfigExists && (
                        <div className="mt-6">
            <Button
                onPress={handleSSOClick}
                color="default"
                variant="bordered"
                fullWidth
                size="md"
                radius="md"
                className="h-11 border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
                isDisabled={!kerberosConfigExists}
                isLoading={isSSOChecking || status === "loading"}
            >
                Connexion automatique
            </Button>
                        </div>
                    )}

                    {/* Section de débogage SSO */}
                    {ssoDebug && (
                        <div
                            className="mt-6 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-sm font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                                Informations de débogage SSO
                            </h3>
                            {ssoError && (
                                <div
                                    className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded border border-red-200 dark:border-red-800 text-xs">
                                    {ssoError}
                                </div>
                            )}
                            <pre
                                className="text-xs text-neutral-600 dark:text-neutral-400 overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(ssoDebug, null, 2)}
                    </pre>
                </div>
            )}
                </div>
            </main>
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
