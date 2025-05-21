'use client';

import {Modal, ModalBody, ModalContent, Spinner} from "@nextui-org/react";
import {useEffect, useState} from "react";

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
        <Modal
            isOpen={true} 
            hideCloseButton={true}
            isDismissable={false}
            classNames={{
                base: "bg-background/80 backdrop-blur-md",
                wrapper: "bg-background/80 backdrop-blur-md"
            }}
        >
            <ModalContent>
                <ModalBody className="flex flex-col items-center justify-center py-8">
                    <Spinner size="lg" color="primary"/>
                    <p className="mt-4 text-lg">Authentification SSO en cours...</p>
                    <p className="mt-2 text-sm text-gray-500">
                        Temps d'attente: {loadingTime} secondes
                    </p>

                    {loadingTime > 5 && (
                        <button
                            onClick={() => setShowDebug(!showDebug)}
                            className="mt-2 text-sm text-blue-500 hover:text-blue-700"
                        >
                            {showDebug ? 'Masquer' : 'Afficher'} les informations de débogage
                        </button>
                    )}

                    {showDebug && debugInfo && (
                        <div className="mt-4 p-4 bg-gray-100 rounded-lg w-full max-h-60 overflow-auto">
                            <h4 className="text-sm font-semibold mb-2">État de l'authentification SSO</h4>
                            <pre className="text-xs">
                                {JSON.stringify(debugInfo, null, 2)}
                            </pre>
                        </div>
                    )}

                    {loadingTime > 10 && (
                        <p className="mt-2 text-sm text-yellow-600">
                            Le chargement prend plus de temps que prévu.
                            Vérifiez la console du navigateur pour plus d'informations.
                        </p>
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
} 