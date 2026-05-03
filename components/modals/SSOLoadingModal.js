'use client';

import {useEffect, useState} from "react";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import SnakeLogo from "@/components/utils/SnakeLogo";

export default function SSOLoadingModal({debugInfo}) {
    const [loadingTime, setLoadingTime] = useState(0);
    const [showDebug, setShowDebug] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setLoadingTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <Dialog open>
            <DialogContent className="bg-background/95 backdrop-blur-md mx-4 sm:mx-0" hideCloseButton>
                <DialogTitle className="sr-only">Authentification SSO en cours</DialogTitle>
                <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-neutral-500">
                    <div className="relative flex h-28 w-28 items-center justify-center">
                        <div className="login-transition-ring absolute inset-0 rounded-full border border-neutral-300 dark:border-neutral-700" />
                        <SnakeLogo className="login-transition-logo h-16 w-16" title="Authentification Spotly" />
                    </div>
                    <p className="mt-3 sm:mt-4 text-base sm:text-lg text-center">Authentification SSO en cours...</p>
                    <p className="mt-2 text-xs sm:text-sm text-center">
                        Temps d&apos;attente: {loadingTime} secondes
                    </p>

                    {loadingTime > 5 && (
                        <button
                            onClick={() => setShowDebug(!showDebug)}
                            className="mt-2 text-xs sm:text-sm text-blue-500 hover:text-blue-700 text-center"
                        >
                            {showDebug ? 'Masquer' : 'Afficher'} les informations de débogage
                        </button>
                    )}

                    {showDebug && debugInfo && (
                        <div
                            className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-100 rounded-lg w-full max-h-48 sm:max-h-60 overflow-auto">
                            <h4 className="text-xs sm:text-sm font-semibold mb-2">État de l&apos;authentification
                                SSO</h4>
                            <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(debugInfo, null, 2)}
                            </pre>
                        </div>
                    )}

                    {loadingTime > 10 && (
                        <p className="mt-2 text-xs sm:text-sm text-yellow-600 text-center px-2">
                            Le chargement prend plus de temps que prévu.
                            Vérifiez la console du navigateur pour plus d&apos;informations.
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
