'use client';

import {ConnectionModal} from "@/components/modals/connectionModal";
import {useRouter, useSearchParams} from 'next/navigation';
import {useSession} from 'next-auth/react';
import React, {useEffect} from 'react';
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

    useEffect(() => {
        if(status === 'authenticated'){
            router.replace("/");
        }
    }, [status, router]);
    console.log("SSO EXIST ? : ", kerberosConfigExists)
    const {
        isLoading: isSSOChecking,
        error: ssoError,
        debug: ssoDebug,
        kerberosConfigExists,
        checkTicket,
        ssoLogin
    } = useSSO({ssoParam, status});

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
        <div className="flex flex-col items-center">
            <div className="absolute top-4 right-4">
                <DarkModeSwitch />
            </div>
            <ConnectionModal />
            <pre className="text-xs bg-neutral-100 dark:bg-neutral-900 rounded p-2 mb-2 max-w-xl w-full overflow-auto">
                {JSON.stringify({kerberosConfigExists, isSSOChecking, ssoError, ssoDebug}, null, 2)}
            </pre>
            <Button
                onPress={handleSSOClick}
                color="warning"
                className="mx-auto m-2 w-[400px]"
                size="lg"
                radius="sm"
                isDisabled={!kerberosConfigExists}
                isLoading={isSSOChecking || status === "loading"}
            >
                Connexion automatique
            </Button>
            {ssoDebug && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg max-w-lg w-full">
                    <h3 className="text-lg font-semibold mb-2">Informations de débogage SSO</h3>
                    {ssoError && (
                        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                            {ssoError}
                        </div>
                    )}
                    <pre className="text-sm overflow-auto">
                        {JSON.stringify(ssoDebug, null, 2)}
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
