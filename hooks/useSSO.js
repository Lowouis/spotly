import {useCallback, useEffect, useState} from 'react';
import {signIn} from 'next-auth/react';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function useSSO({ssoParam, status}) {
    const [kerberosConfigExists, setKerberosConfigExists] = useState(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [debug, setDebug] = useState(null);

    // Fonction dédiée pour récupérer la config Kerberos
    const fetchKerberosConfig = useCallback(async () => {
        try {
            const res = await fetch(`${basePath}/api/public/kerberos-config`);
            if (res.ok) {
                const data = await res.json();
                setKerberosConfigExists(Boolean(data?.realm && data?.serviceHost));
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
                const resSignIn = await signIn('sso-login', {
                    redirect: false,
                    ticket: data.ticket,
                    callbackUrl: window.location.origin + window.location.pathname.replace('/login', '') + window.location.search
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

    // Fonction pour vérifier la présence d'un ticket Kerberos
    const checkTicket = useCallback(async () => {
        try {
            const res = await fetch(`${basePath}/api/public/check-sso`);
            const data = await res.json();
            if (data.ticket) {
                return data.ticket;
            }
            return null;
        } catch {
            return null;
        }
    }, []);

    // Fonction pour authentifier via NextAuth avec un ticket
    const ssoLogin = useCallback(async (ticket) => {
        setIsLoading(true);
        setError(null);
        setDebug(null);
        try {
            const resSignIn = await signIn('sso-login', {
                redirect: false,
                ticket,
                callbackUrl: window.location.origin + window.location.pathname.replace('/login', '') + window.location.search
            });
            if (resSignIn && resSignIn.ok) {
                // Utiliser l'URL de callback fournie par NextAuth
                window.location.href = resSignIn.url;
            } else {
                throw new Error(resSignIn?.error || 'Erreur NextAuth');
            }
        } catch (e) {
            setError(e.message);
            setDebug(e);
            throw e;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Récupération légère de la config au montage. Le ticket SSO n'est demandé qu'au clic.
    useEffect(() => {
        fetchKerberosConfig();
    }, [fetchKerberosConfig]);

    return {
        isLoading,
        error,
        debug,
        kerberosConfigExists,
        checkTicket,
        ssoLogin,
    };
} 
