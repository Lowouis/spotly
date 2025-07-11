import {useCallback, useEffect, useState} from 'react';
import {signIn} from 'next-auth/react';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function useSSO({ manualLogout, ssoParam, status }) {
    const [kerberosConfigExists, setKerberosConfigExists] = useState(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [debug, setDebug] = useState(null);
    const [forceSSO, setForceSSO] = useState(0);
    const [ticketSSO, setTicketSSO] = useState(null);

    // Fonction dédiée pour récupérer la config Kerberos
    const fetchKerberosConfig = useCallback(async () => {
        try {
            const res = await fetch(`${basePath}/api/public/kerberos-config`);
            if (res.ok) {
                const data = await res.json();
                setKerberosConfigExists(data.kerberosConfigExists);
            } else {
                setKerberosConfigExists(false);
            }
        } catch {
            setKerberosConfigExists(false);
        }
    }, []);

    // Fonction dédiée pour gérer le login SSO
    const handleSSOLogin = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setDebug(null);
        try {
            const res = await fetch(`${basePath}/api/public/check-sso`);
            const data = await res.json();
            if (data.ticket) {
                const kerberosResponse = await fetch(`${basePath}/api/auth/callback/kerberos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ticket: data.ticket }),
                });
                if (!kerberosResponse.ok) {
                    const errorData = await kerberosResponse.json();
                    throw new Error(errorData.error || 'Erreur Kerberos');
                }
                const user = await kerberosResponse.json();
                const resSignIn = await signIn('sso-login', {
                    redirect: false,
                    username: user.username,
                });
                if (resSignIn && resSignIn.ok) {
                    window.location.href = `${basePath}/`;
                } else {
                    throw new Error(resSignIn?.error || 'Erreur NextAuth');
                }
            } else if (data.error) {
                throw new Error(data.error);
            } else {
                setDebug(data);
            }
        } catch (e) {
            setError(e.message);
            setDebug(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fonction dédiée pour récupérer le ticket SSO
    const fetchTicket = useCallback(async () => {
        try {
            const res = await fetch(`${basePath}/api/public/check-sso`);
            const data = await res.json();
            if (data.ticket) {
                setTicketSSO(data.ticket);
            } else {
                setTicketSSO(null);
            }
        } catch {
            setTicketSSO(null);
        }
    }, []);

    // Récupération de la config et du ticket au montage
    useEffect(() => {
        fetchKerberosConfig();
        fetchTicket();
    }, [fetchKerberosConfig, fetchTicket]);

    // triggerSSO force le SSO à la demande
    const triggerSSO = useCallback(() => {
        handleSSOLogin();
    }, [handleSSOLogin]);

    return {
        isLoading,
        error,
        debug,
        kerberosConfigExists,
        ticketSSO,
        triggerSSO,
    };
} 